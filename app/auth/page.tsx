"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const FAKE_EMAIL_DOMAIN = "users.miruji.app";
const SAVED_USERNAME_KEY = "miruji_saved_username";

type Mode = "login" | "signup";

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}

function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) return "아이디를 입력해주세요.";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return "아이디는 영문, 숫자, 언더바(_)만 사용해 3~20자로 입력해주세요.";
  }
  return null;
}

function validateRecoveryEmail(email: string): string | null {
  if (!email.trim()) return null; // 선택 입력이므로 비어있으면 통과
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  return ok ? null : "이메일 형식이 올바르지 않습니다.";
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [rememberUsername, setRememberUsername] = useState(true);
  const [isHuman, setIsHuman] = useState(false);

  const [currentUserLabel, setCurrentUserLabel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_USERNAME_KEY);
    if (saved) {
      setUsername(saved);
      setRememberUsername(true);
    }

    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserLabel(extractLabel(session));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  function extractLabel(session: { user?: { user_metadata?: Record<string, unknown>; email?: string | null } } | null) {
    const user = session?.user;
    if (!user) return null;
    const meta = user.user_metadata as { username?: string } | undefined;
    if (meta?.username) return meta.username;
    if (user.email) return user.email.split("@")[0];
    return null;
  }

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    setCurrentUserLabel(extractLabel({ user: data.user ?? undefined }));
  }

  function persistUsernamePreference(value: string) {
    if (rememberUsername) {
      localStorage.setItem(SAVED_USERNAME_KEY, value.trim());
    } else {
      localStorage.removeItem(SAVED_USERNAME_KEY);
    }
  }

  async function signUp() {
    const usernameError = validateUsername(username);
    if (usernameError) {
      setMessage(usernameError);
      return;
    }

    const recoveryError = validateRecoveryEmail(recoveryEmail);
    if (recoveryError) {
      setMessage(recoveryError);
      return;
    }

    if (password.trim().length < 6) {
      setMessage("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    if (!isHuman) {
      setMessage("사람입니다 체크박스를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const trimmedUsername = username.trim();

    const { data: availability, error: availabilityError } = await supabase.rpc(
      "is_username_available",
      { check_username: trimmedUsername }
    );

    if (availabilityError) {
      setMessage(`아이디 확인 실패: ${availabilityError.message}`);
      setLoading(false);
      return;
    }

    if (availability === false) {
      setMessage("이미 사용 중인 아이디입니다.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(trimmedUsername),
      password: password.trim(),
      options: {
        data: {
          username: trimmedUsername,
          display_name: trimmedUsername,
          recovery_email: recoveryEmail.trim() || null,
        },
      },
    });

    if (error) {
      setMessage(`회원가입 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    persistUsernamePreference(trimmedUsername);
    setMessage("회원가입 완료. 바로 로그인됩니다.");
    setLoading(false);
  }

  async function signIn() {
    const usernameError = validateUsername(username);
    if (usernameError) {
      setMessage(usernameError);
      return;
    }

    if (!password.trim()) {
      setMessage("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const trimmedUsername = username.trim();

    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(trimmedUsername),
      password: password.trim(),
    });

    if (error) {
      setMessage(`로그인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    persistUsernamePreference(trimmedUsername);
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

    setCurrentUserLabel(null);
    setPassword("");
    setMessage("로그아웃 완료");
    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
    setPassword("");
    setIsHuman(false);
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
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>
          {currentUserLabel ? "미루지" : mode === "login" ? "로그인" : "회원가입"}
        </h1>

        <p style={{ color: "#64748b", marginBottom: 24 }}>
          {currentUserLabel
            ? "Supabase Auth 연결을 확인합니다."
            : "아이디와 비밀번호로 이용합니다."}
        </p>

        {currentUserLabel ? (
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
              로그인 중: {currentUserLabel}
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
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => switchMode("login")}
                style={tabStyle(mode === "login")}
              >
                로그인
              </button>
              <button
                onClick={() => switchMode("signup")}
                style={tabStyle(mode === "signup")}
              >
                회원가입
              </button>
            </div>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디"
              autoComplete="username"
              style={inputStyle}
            />

            {mode === "signup" && (
              <input
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="복구용 이메일 (선택, 비번 분실 시 사용)"
                autoComplete="email"
                style={inputStyle}
              />
            )}

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              style={inputStyle}
            />

            <label style={checkboxRowStyle}>
              <input
                type="checkbox"
                checked={rememberUsername}
                onChange={(e) => setRememberUsername(e.target.checked)}
              />
              아이디 저장
            </label>

            {mode === "signup" && (
              <label style={checkboxRowStyle}>
                <input
                  type="checkbox"
                  checked={isHuman}
                  onChange={(e) => setIsHuman(e.target.checked)}
                />
                사람입니다
              </label>
            )}

            {mode === "login" ? (
              <button
                onClick={signIn}
                disabled={loading}
                style={buttonStyle("#4f46e5", loading)}
              >
                {loading ? "처리 중..." : "로그인"}
              </button>
            ) : (
              <button
                onClick={signUp}
                disabled={loading || !isHuman}
                style={buttonStyle("#0f172a", loading || !isHuman)}
              >
                {loading ? "처리 중..." : "회원가입"}
              </button>
            )}
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

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  color: "#475569",
  marginBottom: 12,
  cursor: "pointer",
};

function buttonStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "none",
    background: disabled ? "#94a3b8" : color,
    color: "white",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "none",
    background: active ? "#0f172a" : "#f1f5f9",
    color: active ? "#fff" : "#475569",
    fontWeight: 700,
    cursor: "pointer",
  };
}
