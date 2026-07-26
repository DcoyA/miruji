"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState(
    "이메일 인증 정보를 확인하는 중입니다..."
  );

  useEffect(() => {
    completeEmailConfirmation();
  }, []);

  async function completeEmailConfirmation() {
    try {
      const url = new URL(window.location.href);

      const code = url.searchParams.get("code");
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setStatus("error");
          setMessage(`이메일 인증 처리 실패: ${error.message}`);
          return;
        }

        setStatus("success");
        setMessage(
          "이메일 인증이 완료되었습니다. 이제 미루지말자 앱을 사용할 수 있습니다."
        );
        return;
      }

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "signup" | "email",
        });

        if (error) {
          setStatus("error");
          setMessage(`이메일 인증 처리 실패: ${error.message}`);
          return;
        }

        setStatus("success");
        setMessage(
          "이메일 인증이 완료되었습니다. 이제 미루지말자 앱을 사용할 수 있습니다."
        );
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setStatus("success");
        setMessage(
          "이미 로그인되어 있습니다. 미루지말자 앱으로 이동할 수 있습니다."
        );
        return;
      }

      setStatus("error");
      setMessage(
        "인증 정보를 찾을 수 없습니다. 메일의 인증 링크를 다시 열어주세요."
      );
    } catch {
      setStatus("error");
      setMessage("인증 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>미루지말자</div>

        <h1 style={titleStyle}>
          {status === "loading" && "이메일 인증 확인 중"}
          {status === "success" && "이메일 인증 완료"}
          {status === "error" && "이메일 인증 실패"}
        </h1>

        <p style={textStyle}>{message}</p>

        {status === "loading" && (
          <div style={loadingBoxStyle}>잠시만 기다려주세요.</div>
        )}

        {status === "success" && (
          /
            앱으로 이동하기
          </a>
        )}

        {status === "error" && (
          <div style={helpBoxStyle}>
            <p style={{ margin: 0 }}>
              링크가 만료되었거나 올바르지 않을 수 있습니다.
              <br />
              앱으로 돌아가 다시 로그인하거나 회원가입을 시도해주세요.
            </p>

            /
              앱으로 돌아가기
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#e2f3f1",
  padding: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 440,
  background: "#fff",
  borderRadius: 28,
  padding: 28,
  boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
};

const brandStyle: CSSProperties = {
  color: "#4f46e5",
  fontSize: 14,
  fontWeight: 900,
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: 28,
  letterSpacing: "-0.04em",
};

const textStyle: CSSProperties = {
  color: "#475569",
  lineHeight: 1.7,
  marginBottom: 20,
};

const loadingBoxStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
  fontWeight: 700,
};

const primaryLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  padding: 14,
  borderRadius: 14,
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 900,
  textAlign: "center",
  textDecoration: "none",
};

const helpBoxStyle: CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "#fef2f2",
  color: "#b91c1c",
  lineHeight: 1.6,
};

const secondaryLinkStyle: CSSProperties = {
  display: "block",
  marginTop: 14,
  padding: 12,
  borderRadius: 12,
  background: "#fff",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  fontWeight: 900,
  textAlign: "center",
  textDecoration: "none",
};
