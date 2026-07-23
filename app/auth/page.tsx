"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setUserEmail(data.user?.email ?? null);
  }

  async function signUp() {
    if (!email.trim() || !password.trim()) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: {
        data: {
          display_name: email.split("@")[0],
        },
      },
    });

    if (error) {
      setMessage(`회원가입 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("회원가입 완료. 이메일 확인 설정이 켜져 있다면 메일 인증이 필요합니다.");
    setLoading(false);
  }

  async function signIn() {
    if (!email.trim() || !password.trim()) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMessage(`로그인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("로그인 성공");
    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`로그아웃 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setUserEmail(null);
    setMessage("로그아웃 완료");
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: 24,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>로그인 테스트</h1>

        <p style={{ color: "#64748b", marginBottom: 24 }}>
          Supabase Auth 연결을 확인합니다.
        </p>

        {userEmail ? (
          <>
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                background: "#ecfdf5",
                color: "#047857",
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              로그인 중: {userEmail}
            </div>

            <button
              onClick={signOut}
              disabled={loading}
              style={buttonStyle("#ef4444", loading)}
            >
              {loading ? "처리 중..." : "로그아웃"}
            </button>
          </>
        ) : (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일"
              style={inputStyle}
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              style={inputStyle}
            />

            <button
              onClick={signIn}
              disabled={loading}
              style={buttonStyle("#4f46e5", loading)}
            >
              {loading ? "처리 중..." : "로그인"}
            </button>

            <button
              onClick={signUp}
              disabled={loading}
              style={{
                ...buttonStyle("#0f172a", loading),
                marginTop: 10,
              }}
            >
              {loading ? "처리 중..." : "회원가입"}
            </button>
          </>
        )}

        {message && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background:
                message.includes("성공") ||
                message.includes("완료") ||
                message.includes("로그아웃")
                  ? "#ecfdf5"
                  : "#fef2f2",
              color:
                message.includes("성공") ||
                message.includes("완료") ||
                message.includes("로그아웃")
                  ? "#047857"
                  : "#b91c1c",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid #dbeafe",
  marginBottom: 12,
  outline: "none",
};

function buttonStyle(color: string, loading: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: loading ? "#94a3b8" : color,
    color: "white",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
  };
}
