-- ============================================================================
-- notify-new-task 웹훅에서 하드코딩된 service_role 키 제거
-- ============================================================================
--
-- 기존 "notify-new-task" 트리거는 supabase_functions.http_request(...) 를 직접
-- 호출하면서 Authorization 헤더에 service_role JWT 를 문자열로 박아뒀다. 키를
-- 로테이트할 때마다 트리거를 다시 만들어야 했고, db pull 스키마 덤프에 키가
-- 그대로 노출됐다.
--
-- 이 마이그레이션은 동일한 동작을 하는 public.notify_new_task() 트리거 함수를
-- 만들되, bearer 토큰을 Vault(vault.decrypted_secrets, 시크릿 이름
-- 'service_role_key')에서 읽어오도록 한다. 앞으로 키 로테이트는 Vault 값만
-- 갱신하면 되고 코드 변경이 필요 없다.
--
-- ▶ 이 마이그레이션과 별개로, Vault 에 시크릿을 먼저 넣어야 한다 (키 값은 절대
--   마이그레이션/깃에 남기지 말 것):
--
--     select vault.create_secret(
--       '<SERVICE_ROLE_KEY>',
--       'service_role_key',
--       'Bearer token for notify_new_task -> send-task-notification edge function'
--     );
--
--   이후 로테이트 시:
--
--     select vault.update_secret(
--       (select id from vault.secrets where name = 'service_role_key'),
--       '<NEW_KEY>'
--     );
--
-- 시크릿이 없으면 함수는 예외 대신 warning 을 남기고 웹훅만 건너뛴다
-- (tasks INSERT/UPDATE 자체는 절대 막지 않는다).

create or replace function public.notify_new_task()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_url   text := 'https://icbaykoidbmazvsbjmmq.supabase.co/functions/v1/send-task-notification';
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret
    into v_token
    from vault.decrypted_secrets
   where name = 'service_role_key'
   limit 1;

  if v_token is null then
    raise warning 'notify_new_task: vault secret "service_role_key" not found; webhook skipped';
    return new;
  end if;

  -- supabase_functions.http_request(POST ...) 와 동일한 payload 형태를 유지한다.
  select net.http_post(
    url := v_url,
    body := jsonb_build_object(
      'old_record', to_jsonb(old),
      'record',     to_jsonb(new),
      'type',       tg_op,
      'table',      tg_table_name,
      'schema',     tg_table_schema
    ),
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_token
    ),
    timeout_milliseconds := 5000
  ) into v_request_id;

  -- 대시보드 Webhooks 이력용. 실패해도 task 쓰기를 막지 않는다.
  begin
    insert into supabase_functions.hooks (hook_table_id, hook_name, request_id)
    values (tg_relid, tg_name, v_request_id);
  exception when others then
    null;
  end;

  return new;
end;
$function$
;

drop trigger if exists "notify-new-task" on public.tasks;

create trigger "notify-new-task"
  after insert or update on public.tasks
  for each row execute function public.notify_new_task();
