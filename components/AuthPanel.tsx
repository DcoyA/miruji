import type { CSSProperties } from "react";

type AuthMode = "signin" | "signup";

type AuthPanelProps = {
  mode: AuthMode;
  email: string;
  password: string;
  loading: boolean;
  message: string;
  agreedToTerms: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAgreedToTermsChange: (value: boolean) => void;
  onSignIn: () => void;
  onSignUp: () => void;
};

export default function AuthPanel({
  mode,
  email,
  password,
  loading,
  message,
  agreedToTerms,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onAgreedToTermsChange,
  onSignIn,
  onSignUp,
}: AuthPanelProps) {
  return (
    <>
      <h1 style={titleStyle}>미루지말자</h1>
      <p style={subTextStyle}>
        부모와 자녀가 함께 쓰는 미션형 클라우드 다이어리
      </p>

      <div style={tabGridStyle}>
        <button
          onClick={() => onModeChange("signin")}
          style={mode === "signin" ? primaryButtonStyle(false) : secondaryButtonStyle}
        >
          로그인
        </button>

        <button
          onClick={() => onModeChange("signup")}
          style={mode === "signup" ? primaryButtonStyle(false) : secondaryButtonStyle}
        >
          회원가입
        </button>
      </div>

      <input
        value={email}
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="이메일"
        style={inputStyle}
      />

      <input
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="비밀번호"
        type="password"
        style={inputStyle}
      />

      {mode === "signup" && (
        <label style={agreementRowStyle}>
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(event) => onAgreedToTermsChange(event.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" style={legalLinkStyle}>
              이용약관
            </a>
            {" 및 "}
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={legalLinkStyle}>
              개인정보처리방침
            </a>
            에 동의합니다.
          </span>
        </label>
      )}
      
      {mode === "signin" ? (
        <button
          onClick={onSignIn}
          disabled={loading}
          style={primaryButtonStyle(loading)}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      ) : (
        <button
          onClick={onSignUp}
          disabled={loading}
          style={primaryButtonStyle(loading)}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      )}

      {message && <div style={messageBoxStyle(message)}>{message}</div>}
    </>
  );
}

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 30,
  letterSpacing: "-0.04em",
};

const subTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 20,
};

const tabGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  marginBottom: 16,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #dbeafe",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: 13,
  borderRadius: 14,
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#4338ca",
  fontWeight: 800,
  cursor: "pointer",
};

const agreementRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.5,
  marginBottom: 14,
};

const legalLinkStyle: CSSProperties = {
  color: "#4338ca",
  fontWeight: 700,
  textDecoration: "underline",
};

function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: loading ? "#94a3b8" : "#4f46e5",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
  };
}

function messageBoxStyle(message: string): CSSProperties {
  const ok =
    message.includes("완료") ||
    message.includes("성공") ||
    message.includes("불러오기");

  return {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: ok ? "#ecfdf5" : "#fef2f2",
    color: ok ? "#047857" : "#b91c1c",
    fontSize: 14,
    lineHeight: 1.5,
  };
}
