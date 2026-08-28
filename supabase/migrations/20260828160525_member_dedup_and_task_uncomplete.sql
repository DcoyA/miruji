-- ============================================================================
-- 문제 1: 동일 사용자 중복 멤버 방지
-- ============================================================================
--
-- (1) accept_workspace_invite 를 수정한다.
--     - 이미 active 멤버면 새 행을 만들지 않고 막는다.
--     - 예전에 나갔던(active 가 아닌) 행이 있으면 새로 만들지 않고 되살린다.
--       초대에 적힌 이름이 다르면 display_name 도 갱신한다.
--     - 이름이 일치하는 미연결 가상 멤버가 있으면 그 행을 실제 계정으로 전환한다.
--     - 위 어느 경우도 아니면 그때만 새 행을 만든다.
--
-- (2) status = 'active' 인 (workspace_id, profile_id) 조합에 대해 부분 유니크
--     인덱스를 건다. 실제 계정(profile_id is not null)만 대상으로 하며 가상 멤버는
--     제외한다. (dev 에 기존 중복 active 행이 없음을 미리 확인함)

create or replace function public.accept_workspace_invite(input_code text)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_invite record;
  v_profile_id uuid;
  v_member_id uuid;
  v_display_name text;
  v_creator_profile_id uuid;
  v_virtual_member_id uuid;
  v_prev_member_id uuid;
  v_prev_display_name text;
begin
  select id into v_profile_id from profiles where auth_user_id = auth.uid();
  if v_profile_id is null then
    raise exception 'no profile';
  end if;

  select * into v_invite from workspace_invites
    where invite_code = upper(input_code) and status = 'pending'
    limit 1;

  if v_invite is null then
    raise exception 'invalid or already used invite code';
  end if;

  if v_invite.expires_at < now() then
    update workspace_invites set status = 'expired' where id = v_invite.id;
    raise exception 'invite expired';
  end if;

  -- 이미 활성 멤버면 새 행을 만들지 않고 막는다.
  if exists (
    select 1 from workspace_members
    where workspace_id = v_invite.workspace_id
      and profile_id = v_profile_id
      and status = 'active'
  ) then
    raise exception 'already a member of this workspace';
  end if;

  select display_name into v_display_name from profiles where id = v_profile_id;

  select profile_id into v_creator_profile_id
    from workspace_members
    where id = v_invite.created_by_member_id;

  -- (A) 예전에 나갔던(active 가 아닌) 같은 계정의 행이 있으면 되살린다.
  select id, display_name
    into v_prev_member_id, v_prev_display_name
    from workspace_members
    where workspace_id = v_invite.workspace_id
      and profile_id = v_profile_id
      and status <> 'active'
    order by created_at desc
    limit 1;

  if v_prev_member_id is not null then
    update workspace_members
      set status = 'active',
          is_virtual = false,
          requires_account = true,
          display_name = case
            when v_invite.suggested_name is not null
             and v_invite.suggested_name <> ''
             and v_invite.suggested_name is distinct from v_prev_display_name
            then v_invite.suggested_name
            else display_name
          end
      where id = v_prev_member_id
      returning id into v_member_id;

  else
    -- (B) 이름이 일치하는 미연결 가상 멤버가 있으면 실제 계정으로 전환한다.
    if v_invite.suggested_name is not null then
      select id into v_virtual_member_id
        from workspace_members
        where workspace_id = v_invite.workspace_id
          and is_virtual = true
          and profile_id is null
          and status = 'active'
          and display_name = v_invite.suggested_name
        limit 1;
    end if;

    if v_virtual_member_id is not null then
      update workspace_members
        set profile_id = v_profile_id,
            is_virtual = false,
            requires_account = true
        where id = v_virtual_member_id
        returning id into v_member_id;
    else
      -- (C) 아무것도 없을 때만 새로 만든다.
      insert into workspace_members (
        workspace_id, profile_id, display_name, role, status, is_virtual, requires_account, created_by
      ) values (
        v_invite.workspace_id,
        v_profile_id,
        coalesce(v_invite.suggested_name, v_display_name, '새 참여자'),
        v_invite.role,
        'active',
        false,
        true,
        coalesce(v_creator_profile_id, v_profile_id)
      )
      returning id into v_member_id;
    end if;
  end if;

  update workspace_invites
    set status = 'accepted', accepted_by_profile_id = v_profile_id, accepted_at = now()
    where id = v_invite.id;

  return jsonb_build_object('workspace_id', v_invite.workspace_id, 'member_id', v_member_id, 'status', 'accepted');
end;
$function$
;

-- 활성 상태의 실제 계정에 대해 (workspace_id, profile_id) 중복 금지.
-- profile_id is null 인 가상 멤버는 대상에서 제외한다.
create unique index if not exists workspace_members_active_profile_uidx
  on public.workspace_members (workspace_id, profile_id)
  where status = 'active' and profile_id is not null;

-- ============================================================================
-- 문제 2: 완료된 할 일의 "완료 취소"
-- ============================================================================
--
-- trg_enforce_task_update -> enforce_task_update_permissions() 는 방장/부방장
-- (is_workspace_manager) 이면 조건 검사 없이 통과시키므로, 매니저가 tasks.status
-- 를 'approved' -> 'todo' 로 되돌리는 동작은 트리거에 막히지 않는다.
-- reward_transactions insert RLS 도 is_workspace_manager 만 허용하므로 포인트
-- 회수(역방향 거래) 삽입도 매니저 기준으로 일관된다.
-- 따라서 이 기능에는 스키마 변경이 필요 없으며, 이 주석만 기록으로 남긴다.
