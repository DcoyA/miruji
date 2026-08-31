# send-task-notification

`public.tasks` 의 `notify-new-task` 트리거(`notify_new_task()`)가 표준 DB 웹훅
payload 로 호출하는 Edge Function. 대상 참여자를 정한 뒤 `device_tokens` 를
`platform` 별로 분기해서 발송한다.

| platform | 경로 |
|---|---|
| `ios` | APNs HTTP/2, `.p8` 로 서명한 ES256 JWT |
| `android` | FCM HTTP v1, Firebase 서비스 계정 → OAuth2 |
| `web-push` | Web Push (VAPID) — 기존 동작 |

응답 `410` / `Unregistered` / `UNREGISTERED` 등이면 해당 `device_tokens` 행을 삭제한다.
반환값: `{ sent, failed }` (알림 대상이 없으면 `{ sent: 0 }`).

## 환경변수

자동 주입: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

```bash
# APNs (iOS)
supabase secrets set \
  APNS_KEY_ID=JS4F6X7UCM \
  APNS_TEAM_ID=KSGTC4ND7X \
  APNS_BUNDLE_ID=com.miruji.app \
  --project-ref <ref>
supabase secrets set APNS_PRIVATE_KEY="$(cat AuthKey_JS4F6X7UCM.p8)" --project-ref <ref>
# APNS_HOST 는 선택 (기본 https://api.push.apple.com; 개발용은 https://api.sandbox.push.apple.com)

# FCM (Android) — Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키
supabase secrets set FCM_SERVICE_ACCOUNT="$(cat firebase-service-account.json)" --project-ref <ref>
# FCM_PROJECT_ID 는 선택 (기본은 서비스 계정 JSON 의 project_id, = miruji)

# Web Push (VAPID) — 기존에 쓰던 값 그대로
supabase secrets set \
  VAPID_PUBLIC_KEY=<NEXT_PUBLIC_VAPID_PUBLIC_KEY 와 동일> \
  VAPID_PRIVATE_KEY=<기존 비공개 키> \
  VAPID_SUBJECT=mailto:iamborghini5757@gmail.com \
  --project-ref <ref>

# 선택: 설정하면 Authorization: Bearer <값> 을 검증한다
# (트리거의 Vault 시크릿 service_role_key 를 이 값으로 맞춰야 함)
# supabase secrets set NOTIFY_WEBHOOK_SECRET=<...> --project-ref <ref>
```

dev(`icbaykoidbmazvsbjmmq`) / 운영(`qutnpjhfsdqrqckdovgx`) 각각 설정한다.

## 배포

```bash
supabase functions deploy send-task-notification --project-ref <ref>
```

`verify_jwt` 는 기본값(true) 그대로 둔다. 트리거가 보내는 `Authorization: Bearer <service_role_key>`
(Vault 값)를 게이트웨이가 통과시키는 것을 이미 확인함. 나중에 legacy API 키를 비활성화해서
게이트웨이가 막으면 `supabase/config.toml` 에 아래를 추가하고 재배포한다.

```toml
[functions.send-task-notification]
verify_jwt = false
```

## 로그 확인

```bash
supabase functions logs send-task-notification --project-ref <ref>
```

## 알림 규칙 (index.ts `decide()`)

| 이벤트 | 대상 | 문구 |
|---|---|---|
| 할 일 생성 (INSERT) | 담당자 | "새 할 일이 등록됐어요" |
| `todo → submitted` | 만든 사람 | "완료 확인 요청" |
| `→ approved` | 담당자 | "할 일이 승인됐어요 · +N 포인트" |
| `→ rejected` | 담당자 | "할 일이 반려됐어요" |

대상 참여자는 계정이 연결돼 있고(`profile_id`), `status='active'`, `notifications_enabled` 가
false 가 아니어야 발송한다. 규칙을 바꾸려면 `decide()` 만 수정하면 된다.
