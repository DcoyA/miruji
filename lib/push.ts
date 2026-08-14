"use client";

import { supabase } from "@/lib/supabase/client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function enablePushNotifications(): Promise<{ ok: boolean; message: string }> {
  try {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, message: "이 브라우저는 알림 기능을 지원하지 않습니다." };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, message: "알림 권한이 허용되지 않았습니다." };
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const { data: userData } = await supabase.auth.getUser();
    const authUserId = userData?.user?.id;
    if (!authUserId) {
      return { ok: false, message: "로그인 정보를 확인하지 못했습니다." };
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", authUserId)
      .single();

    if (profileError || !profileRow) {
      return { ok: false, message: "프로필 정보를 확인하지 못했습니다." };
    }

    const profileId = profileRow.id;
    const tokenPayload = JSON.stringify(subscription.toJSON());

    const { error } = await supabase
      .from("device_tokens")
      .upsert(
        {
          profile_id: profileId,
          platform: "web-push",
          token: tokenPayload,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,platform" }
      );

    if (error) {
      return { ok: false, message: `알림 등록 실패: ${error.message}` };
    }

    return { ok: true, message: "알림이 활성화되었습니다." };
  } catch {
    return { ok: false, message: "알림 활성화 중 오류가 발생했습니다." };
  }
}
