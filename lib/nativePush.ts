"use client";

import { supabase } from "@/lib/supabase/client";

// Capacitor 네이티브 앱(WebView) 안에서만 동작한다. 일반 브라우저에서는 no-op.
// 웹 푸시(Service Worker + VAPID)는 lib/push.ts 의 enablePushNotifications 가 담당한다.
//
// 네이티브에서는 OS 가 발급한 토큰(iOS: APNs device token, Android: FCM 등록 토큰)을
// device_tokens 테이블에 platform = "ios" | "android" 로 upsert 한다.
// 실제 발송은 저장소 밖의 Supabase Edge Function(send-task-notification)이
// platform 별로 APNs / FCM 를 호출해서 처리한다.

let registered = false;

export async function registerNativePush(): Promise<{ ok: boolean; message: string }> {
  if (typeof window === "undefined") return { ok: false, message: "" };

  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, message: "네이티브 앱에서만 사용할 수 있습니다." };
  }
  if (registered) return { ok: true, message: "이미 등록되어 있습니다." };

  const { PushNotifications } = await import("@capacitor/push-notifications");
  const platform = Capacitor.getPlatform(); // "ios" | "android"

  await PushNotifications.removeAllListeners();

  PushNotifications.addListener("registration", async (token) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData?.user?.id;
      if (!authUserId) return;

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", authUserId)
        .single();
      if (!profileRow) return;

      await supabase.from("device_tokens").upsert(
        {
          profile_id: profileRow.id,
          platform,
          token: token.value,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,platform" }
      );
    } catch {
      // 토큰 저장 실패는 조용히 무시한다 (다음 실행 때 다시 시도됨).
    }
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("[nativePush] registration error", error);
  });

  // 알림을 눌러 앱이 열렸을 때, data.url 이 있으면 해당 경로로 이동한다 (초대 링크 등).
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = action.notification?.data?.url;
    if (typeof url === "string" && url.startsWith("/")) {
      window.location.href = url;
    }
  });

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") {
    return { ok: false, message: "알림 권한이 허용되지 않았습니다." };
  }

  await PushNotifications.register();
  registered = true;
  return { ok: true, message: "알림이 활성화되었습니다." };
}
