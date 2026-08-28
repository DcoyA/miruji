"use client";

import { Suspense, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PENDING_INVITE_STORAGE_KEY = "miruji_pending_invite_code";

// 카카오톡 인앱 브라우저(웹뷰)에서는 구글 로그인 팝업이 보안 정책상 막힌다.
// User-Agent에 'KAKAOTALK'이 있으면 자동 리다이렉트 대신 외부 브라우저로 열도록 안내한다.
function isKakaoTalkInAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /KAKAOTALK/i.test(navigator.userAgent);
}

function JoinRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inKakaoBrowser, setInKakaoBrowser] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && typeof window !== "undefined") {
      window.localStorage.setItem(PENDING_INVITE_STORAGE_KEY, code.trim().toUpperCase());
    }

    // 카카오톡 인앱 브라우저면 자동 리다이렉트하지 않고 안내 화면을 보여준다.
    if (isKakaoTalkInAppBrowser()) {
      setInKakaoBrowser(true);
      return;
    }

    router.replace("/");
  }, [searchParams, router]);

  function openInExternalBrowser() {
    const target = window.location.href;
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(target)}`;
  }

  if (!inKakaoBrowser) {
    return <p style={infoTextStyle}>초대 확인 중입니다...</p>;
  }

  return (
    <div style={cardStyle}>
      <p style={guideTextStyle}>
        카카오톡 브라우저에서는 로그인이 제한됩니다.
        <br />
        아래 버튼을 눌러 브라우저에서 열어주세요.
      </p>
      <button type="button" onClick={openInExternalBrowser} style={buttonStyle}>
        브라우저에서 열기
      </button>
    </div>
  );
}

export default function JoinClient() {
  return (
    <main style={mainStyle}>
      <Suspense fallback={<p style={infoTextStyle}>초대 확인 중입니다...</p>}>
        <JoinRedirect />
      </Suspense>
    </main>
  );
}

const mainStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#e2f3f1",
  padding: 20,
};

const infoTextStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 700,
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 360,
  background: "#ffffff",
  borderRadius: 20,
  padding: 24,
  textAlign: "center",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12)",
};

const guideTextStyle: CSSProperties = {
  margin: "0 0 18px",
  color: "#0f172a",
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.6,
};

const buttonStyle: CSSProperties = {
  width: "100%",
  padding: "13px 16px",
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#ffffff",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(108, 99, 255, 0.30)",
};
