-- ============================================================================
-- 버그: 담당자 본인이 자기 할 일을 완료해도 포인트가 적립되지 않음
-- ============================================================================
--
-- reward_transactions INSERT 정책이 방장/부방장(is_workspace_manager)에게만
-- 허용돼 있어서, 매니저가 아닌 참여자가 자기에게 배정된 할 일을 직접 완료하면
-- (생성자 == 담당자인 경우 포함) 클라이언트의 포인트 적립 INSERT 가 RLS 에
-- 막혀 아무 포인트도 쌓이지 않았다.
--
-- 매니저 권한은 그대로 두고, "본인에게 배정된 approved 상태의 할 일에 대해
-- 정확히 그 할 일의 reward_points 만큼, 본인 앞으로 earn 을 기록"하는 경우만
-- 추가로 허용한다.

drop policy if exists "reward_transactions_insert_allowed" on "public"."reward_transactions";

create policy "reward_transactions_insert_allowed"
on "public"."reward_transactions"
as permissive
for insert
to public
with check (
  public.is_workspace_manager(workspace_id)
  or (
    transaction_type = 'earn'
    and source_type = 'task'
    and amount > 0
    and exists (
      select 1
      from public.tasks t
      join public.workspace_members m on m.id = t.assigned_member_id
      where t.id = reward_transactions.source_id
        and t.workspace_id = reward_transactions.workspace_id
        and t.status = 'approved'
        and t.reward_points = reward_transactions.amount
        and t.assigned_member_id = reward_transactions.member_id
        and m.profile_id = public.current_profile_id()
        and m.status = 'active'
    )
  )
);
