// send-task-notification
// -----------------------------------------------------------------------------
// public.tasks 의 "notify-new-task" 트리거(notify_new_task())가 표준 DB 웹훅
// payload 로 이 함수를 호출한다:  { type, table, record, old_record, schema }
//
// 대상 참여자에게 보낼 알림을 결정한 뒤, 그 참여자의 device_tokens 를 platform
// 별로 분기해서 발송한다:
//   - "ios"      -> APNs (HTTP/2, ES256 JWT)
//   - "android"  -> FCM HTTP v1 (service account -> OAuth2)
//   - "web-push" -> Web Push (VAPID)  ← 기존 동작 유지
// 죽은 토큰(410 / Unregistered 등)은 device_tokens 에서 삭제한다.
//
// 필요한 환경변수 (supabase secrets set ...):
//   자동 주입: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   APNs : APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID(=com.miruji.app),
//          APNS_PRIVATE_KEY(=AuthKey_XXX.p8 내용), APNS_HOST(선택,
//          기본 https://api.push.apple.com)
//   FCM  : FCM_SERVICE_ACCOUNT(Firebase 서비스 계정 JSON 문자열),
//          FCM_PROJECT_ID(선택, 기본은 서비스계정의 project_id)
//   Web  : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT(선택)
//   선택 : NOTIFY_WEBHOOK_SECRET (설정 시 Authorization: Bearer <값> 검증)
// -----------------------------------------------------------------------------

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type TaskRecord = {
  id: string;
  workspace_id: string;
  title: string;
  status: string;
  assigned_member_id: string | null;
  created_by_member_id: string | null;
  reward_points: number | null;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: TaskRecord | null;
  old_record: TaskRecord | null;
};

type Msg = { title: string; body: string; url: string };
type SendResult = { ok: boolean; dead?: boolean; detail?: string };
type Decision = { profileId: string; title: string; body: string; url: string };

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------

function envOrThrow(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`missing env ${name}`);
  return v;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----(BEGIN|END)[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

function b64url(data: ArrayBuffer | Uint8Array | string): string {
  let bin: string;
  if (typeof data === "string") {
    bin = data;
  } else {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    bin = String.fromCharCode(...bytes);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// -----------------------------------------------------------------------------
// APNs (iOS)
// -----------------------------------------------------------------------------

let apnsJwt: { token: string; iat: number } | null = null;

async function getApnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (apnsJwt && now - apnsJwt.iat < 3000) return apnsJwt.token;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(envOrThrow("APNS_PRIVATE_KEY")),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const header = b64url(JSON.stringify({ alg: "ES256", kid: envOrThrow("APNS_KEY_ID") }));
  const claims = b64url(JSON.stringify({ iss: envOrThrow("APNS_TEAM_ID"), iat: now }));
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const token = `${header}.${claims}.${b64url(sig)}`;
  apnsJwt = { token, iat: now };
  return token;
}

async function sendAPNs(deviceToken: string, msg: Msg): Promise<SendResult> {
  const host = Deno.env.get("APNS_HOST") ?? "https://api.push.apple.com";
  const res = await fetch(`${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${await getApnsJwt()}`,
      "apns-topic": envOrThrow("APNS_BUNDLE_ID"),
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: JSON.stringify({
      aps: { alert: { title: msg.title, body: msg.body }, sound: "default" },
      url: msg.url,
    }),
  });
  if (res.ok) return { ok: true };
  const text = await res.text().catch(() => "");
  const dead = res.status === 410 || /BadDeviceToken|Unregistered/i.test(text);
  return { ok: false, dead, detail: `apns ${res.status} ${text}` };
}

// -----------------------------------------------------------------------------
// FCM (Android)
// -----------------------------------------------------------------------------

let fcmToken: { token: string; exp: number } | null = null;

async function getFcmAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (fcmToken && fcmToken.exp > now + 60) return fcmToken.token;

  const sa = JSON.parse(envOrThrow("FCM_SERVICE_ACCOUNT"));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${b64url(sig)}`;

  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${assertion}`,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`fcm token ${res.status} ${JSON.stringify(body)}`);
  fcmToken = { token: body.access_token, exp: now + (body.expires_in ?? 3600) };
  return body.access_token;
}

async function sendFCM(regToken: string, msg: Msg): Promise<SendResult> {
  const projectId = Deno.env.get("FCM_PROJECT_ID") ??
    JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT") ?? "{}").project_id;
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${await getFcmAccessToken()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: regToken,
          notification: { title: msg.title, body: msg.body },
          data: { url: msg.url },
          android: { priority: "high", notification: { sound: "default" } },
        },
      }),
    },
  );
  if (res.ok) return { ok: true };
  const text = await res.text().catch(() => "");
  const dead = res.status === 404 ||
    /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT/i.test(text);
  return { ok: false, dead, detail: `fcm ${res.status} ${text}` };
}

// -----------------------------------------------------------------------------
// Web Push (unchanged behaviour)
// -----------------------------------------------------------------------------

let vapidReady = false;

function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    Deno.env.get("VAPID_SUBJECT") ?? "mailto:iamborghini5757@gmail.com",
    envOrThrow("VAPID_PUBLIC_KEY"),
    envOrThrow("VAPID_PRIVATE_KEY"),
  );
  vapidReady = true;
}

async function sendWebPush(tokenJson: string, msg: Msg): Promise<SendResult> {
  ensureVapid();
  try {
    const subscription = JSON.parse(tokenJson);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: msg.title, body: msg.body, url: msg.url }),
    );
    return { ok: true };
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return {
      ok: false,
      dead: status === 404 || status === 410,
      detail: `webpush ${status ?? ""} ${(e as Error).message}`,
    };
  }
}

// -----------------------------------------------------------------------------
// notification decision + fan-out
// -----------------------------------------------------------------------------

async function resolveMemberProfile(memberId: string): Promise<string | null> {
  const { data } = await supabase
    .from("workspace_members")
    .select("profile_id, notifications_enabled, status")
    .eq("id", memberId)
    .maybeSingle();
  if (
    !data || !data.profile_id || data.status !== "active" ||
    data.notifications_enabled === false
  ) {
    return null;
  }
  return data.profile_id;
}

async function decide(p: WebhookPayload): Promise<Decision | null> {
  const rec = p.record;
  if (!rec || p.table !== "tasks") return null;

  if (p.type === "INSERT") {
    if (!rec.assigned_member_id) return null;
    const profileId = await resolveMemberProfile(rec.assigned_member_id);
    if (!profileId) return null;
    return { profileId, title: "새 할 일이 등록됐어요", body: rec.title, url: "/" };
  }

  if (p.type === "UPDATE" && p.old_record && p.old_record.status !== rec.status) {
    if (rec.status === "submitted" && rec.created_by_member_id) {
      const profileId = await resolveMemberProfile(rec.created_by_member_id);
      if (profileId) return { profileId, title: "완료 확인 요청", body: rec.title, url: "/" };
    }
    if (rec.status === "approved" && rec.assigned_member_id) {
      const profileId = await resolveMemberProfile(rec.assigned_member_id);
      if (profileId) {
        const pts = rec.reward_points ? ` · +${rec.reward_points} 포인트` : "";
        return { profileId, title: "할 일이 승인됐어요", body: `${rec.title}${pts}`, url: "/" };
      }
    }
    if (rec.status === "rejected" && rec.assigned_member_id) {
      const profileId = await resolveMemberProfile(rec.assigned_member_id);
      if (profileId) return { profileId, title: "할 일이 반려됐어요", body: rec.title, url: "/" };
    }
  }

  return null;
}

async function sendToProfile(
  profileId: string,
  msg: Msg,
): Promise<{ sent: number; failed: number }> {
  const { data: tokens } = await supabase
    .from("device_tokens")
    .select("id, platform, token")
    .eq("profile_id", profileId);

  if (!tokens || tokens.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];

  for (const row of tokens) {
    let result: SendResult;
    try {
      if (row.platform === "ios") result = await sendAPNs(row.token, msg);
      else if (row.platform === "android") result = await sendFCM(row.token, msg);
      else if (row.platform === "web-push") result = await sendWebPush(row.token, msg);
      else result = { ok: false, detail: `unknown platform ${row.platform}` };
    } catch (e) {
      result = { ok: false, detail: (e as Error).message };
    }

    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error("[send-task-notification]", result.detail);
      if (result.dead) dead.push(row.id);
    }
  }

  if (dead.length > 0) {
    await supabase.from("device_tokens").delete().in("id", dead);
  }

  return { sent, failed };
}

// -----------------------------------------------------------------------------
// entrypoint
// -----------------------------------------------------------------------------

Deno.serve(async (req) => {
  const requiredSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET");
  if (requiredSecret && req.headers.get("authorization") !== `Bearer ${requiredSecret}`) {
    return json({ error: "unauthorized" }, 401);
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  let decision: Decision | null = null;
  try {
    decision = await decide(payload);
  } catch (e) {
    console.error("[send-task-notification] decide failed", (e as Error).message);
    return json({ sent: 0, error: "decide-failed" }, 200);
  }

  if (!decision) return json({ sent: 0 });

  const result = await sendToProfile(decision.profileId, {
    title: decision.title,
    body: decision.body,
    url: decision.url,
  });
  return json(result);
});
