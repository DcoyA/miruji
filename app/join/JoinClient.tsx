"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PENDING_INVITE_STORAGE_KEY = "miruji_pending_invite_code";

function JoinRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && typeof window !== "undefined") {
      window.localStorage.setItem(PENDING_INVITE_STORAGE_KEY, code.trim().toUpperCase());
    }
    router.replace("/");
  }, [searchParams, router]);

  return null;
}

export default function JoinClient() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#e2f3f1",
      }}
    >
      <Suspense fallback={null}>
        <JoinRedirect />
      </Suspense>
      <p style={{ color: "#0f172a", fontWeight: 700 }}>초대 확인 중입니다...</p>
    </main>
  );
}
