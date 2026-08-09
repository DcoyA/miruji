"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthResetPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "done">("loading");
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    prepareSession();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function prepareSession() {
    try {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setMessage(`재설정 링크 확인 실패: ${error.message}`);
          return;
        }
        setStatus("ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus("ready");
        return;
      }
      // 해시(#access_token=...&type=recovery) 방식은 위 onAuthStateChange에서 처리됩니다.
    } catch {
      setStatus("error");
      setMessage("링크 확인 중 문제가 발생했습니다. 메일의 링크를 다시 열어주세요.");
    }
  }

  async function submitNewPassword() {
    if (!newPassword.trim() || !newPasswordConfirm.trim()) {
      setMessage("새 비밀번호를 두 칸 모두 입력해주세요.");
      return;
    }
    if (newPassword.trim().length < 6) {
      setMessage("비밀번호는 6자 이상으로 입력해주세요.");
      return;
    }
    if (newPassword.trim() !== newPasswordConfirm.trim()) {
      setMessage("두 비밀번호가 서로 다릅니다. 다시 확인해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });

    if (error) {
      setMessage(`비밀번호 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setStatus("done");
    setMessage("비밀번호가 변경되었습니다. 이제 새 비밀번호로 로그인해주세요.");
    setLoading(false);
  }

  function goHome() {
    window.location.href = "/";
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <div style={brandStyle}>미루지말자</div>

        <h1 style={titleStyle}>
          {status === "loading" && "링크 확인 중"}
          {status === "ready" && "새 비밀번호 설정"}
          {status === "error" && "링크 확인 실패"}
          {status === "done" && "변경 완료"}
        </h1>

        {status === "loading" && <div style={loadingBoxStyle}>잠시만 기다려주세요.</div>}

        {status === "ready" && (
          <>
            <p style={textStyle}>계정에 사용할 새 비밀번호를 입력해주세요.</p>
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="새 비밀번호"
              type="password"
              style={inputStyle}
            />
            <input
              value={newPasswordConfirm}
              onChange={(event) => setNewPasswordConfirm(event.target.value)}
              placeholder="새 비밀번호 확인"
              type="password"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={submitNewPassword}
              disabled={loading}
              style={primaryButtonStyle(loading)}
            >
              {loading ? "변경 중..." : "비밀번호 변경하기"}
            </button>
            {message && <div style={helpBoxStyle}>{message}</div>}
          </>
        )}

        {status === "done" && (
          <>
            <div style={doneBoxStyle}>{message}</div>
            <button type="button" onClick={goHome} style={primaryButtonStyle(false)}>
              로그인 화면으로 이동하기
            </button>
          </>
        )}

        {status === "error" && (
          <div style={helpBoxStyle}>
            <p style={{ margin: 0 }}>
              {message || "링크가 만료되었거나 올바르지 않을 수 있습니다."}
              <br />
              앱으로 돌아가 비밀번호 찾기를 다시 시도해주세요.
            </p>
            <button type="button" onClick={goHome} style={secondaryButtonStyle}>
              앱으로 돌아가기
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#fff7f5",
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
  boxShadow: "0 20px 60px rgba(219,39,119,0.12)",
};

const brandStyle: CSSProperties = { color: "#db2777", fontSize: 14, fontWeight: 900, marginBottom: 8 };
const titleStyle: CSSProperties = { margin: "0 0 12px", fontSize: 28, letterSpacing: "-0.04em", color: "#3f1d24" };
const textStyle: CSSProperties = { color: "#9f6b75", lineHeight: 1.7, marginBottom: 16 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #fbcfe8", marginBottom: 12, outline: "none", fontSize: 15 };
const loadingBoxStyle: CSSProperties = { padding: 14, borderRadius: 14, background: "#fff8f7", color: "#9f6b75", textAlign: "center", fontWeight: 700 };
const doneBoxStyle: CSSProperties = { padding: 14, borderRadius: 14, background: "#ecfdf5", color: "#047857", marginBottom: 16, lineHeight: 1.6, fontWeight: 700 };
const helpBoxStyle: CSSProperties = { padding: 14, borderRadius: 14, background: "#fef2f2", color: "#b91c1c", lineHeight: 1.6, marginTop: 4 };
const secondaryButtonStyle: CSSProperties = { display: "block", width: "100%", marginTop: 14, padding: 12, borderRadius: 12, background: "#fff", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 900, textAlign: "center", cursor: "pointer" };
function primaryButtonStyle(loading: boolean): CSSProperties {
  return { display: "block", width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "linear-gradient(135deg, #fb7185, #e11d48)", color: "#fff", fontWeight: 900, textAlign: "center", cursor: loading ? "not-allowed" : "pointer", marginTop: 4 };
}
