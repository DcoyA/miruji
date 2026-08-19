"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import BrandCharacter from "@/components/BrandCharacter";

type AuthMode = "signin" | "signup" | "forgot";

type AuthPanelProps = {
  mode: AuthMode;
  username: string;
  password: string;
  recoveryEmail: string;
  loading: boolean;
  message: string;
  agreedToTerms: boolean;
  isHuman: boolean;
  rememberUsername: boolean;
  onModeChange: (mode: AuthMode) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRecoveryEmailChange: (value: string) => void;
  onAgreedToTermsChange: (value: boolean) => void;
  onIsHumanChange: (value: boolean) => void;
  onRememberUsernameChange: (value: boolean) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onRequestPasswordReset: (message: string, contactEmail: string) => void;
};

export default function AuthPanel({
  mode,
  username,
  password,
  recoveryEmail,
  loading,
  message,
  agreedToTerms,
  isHuman,
  rememberUsername,
  onModeChange,
  onUsernameChange,
  onPasswordChange,
  onRecoveryEmailChange,
  onAgreedToTermsChange,
  onIsHumanChange,
  onRememberUsernameChange,
  onSignIn,
  onSignUp,
  onRequestPasswordReset,
}: AuthPanelProps) {
  const [resetRequestMessage, setResetRequestMessage] = useState("");
  const [resetContactEmail, setResetContactEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (mode === "forgot") {
    return (
      <>
        <div style={brandRowStyle}>
          <BrandCharacter size={40} />
          <h1 style={titleStyle}>미루지말자</h1>
        </div>
        <p style={subTextStyle}>
          비밀번호를 잊으셨다면 아래 내용을 남겨주세요. 확인 후 안내드릴게요.
        </p>

        <input
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="아이디"
          autoComplete="username"
          style={inputStyle}
        />

        <input
          value={resetContactEmail}
          onChange={(event) => setResetContactEmail(event.target.value)}
          placeholder="답장 받을 이메일 주소 (필수)"
          type="email"
          autoComplete="email"
          style={inputStyle}
        />

        <textarea
          value={resetRequestMessage}
          onChange={(event) => setResetRequestMessage(event.target.value)}
          placeholder="상황을 간단히 남겨주세요. (예: 비밀번호가 기억나지 않아요)"
          rows={4}
          style={textareaStyle}
        />

        <button
          type="button"
          onClick={() => onRequestPasswordReset(resetRequestMessage, resetContactEmail)}
          disabled={loading}
          style={primaryButtonStyle(loading)}
        >
          {loading ? "요청 접수 중..." : "요청 보내기"}
        </button>

        <button type="button" onClick={() => onModeChange("signin")} style={backLinkButtonStyle}>
          ← 로그인으로 돌아가기
        </button>

        {message && <div style={messageBoxStyle(message)}>{message}</div>}
      </>
    );
  }

  return (
    <>
      <div style={brandRowStyle}>
        <BrandCharacter size={40} />
        <h1 style={titleStyle}>미루지말자</h1>
      </div>
      <p style={subTextStyle}>함께 쓰는 미션형 다이어리</p>

      <div style={tabGridStyle}>
        <button
          onClick={() => onModeChange("signin")}
          style={mode === "signin" ? primaryTabButtonStyle : secondaryButtonStyle}
        >
          로그인
        </button>

        <button
          onClick={() => onModeChange("signup")}
          style={mode === "signup" ? primaryTabButtonStyle : secondaryButtonStyle}
        >
          회원가입
        </button>
      </div>

      <input
        value={username}
        onChange={(event) => onUsernameChange(event.target.value)}
        placeholder="아이디"
        autoComplete="username"
        style={inputStyle}
      />

      {mode === "signup" && (
        <input
          value={recoveryEmail}
          onChange={(event) => onRecoveryEmailChange(event.target.value)}
          placeholder="복구용 이메일 (선택, 비번 분실 시 사용)"
          autoComplete="email"
          style={inputStyle}
        />
      )}

      <input
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        placeholder="비밀번호"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        style={inputStyle}
      />

      {mode === "signup" && (
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          style={inputStyle}
        />
      )}

      {mode === "signup" && confirmPassword.length > 0 && password !== confirmPassword && (
        <p style={{ marginTop: -6, marginBottom: 12, fontSize: 13, color: "#e0245b" }}>
          비밀번호가 일치하지 않습니다.
        </p>
      )}

      <label style={agreementRowStyle}>
        <input
          type="checkbox"
          checked={rememberUsername}
          onChange={(event) => onRememberUsernameChange(event.target.checked)}
          style={checkboxStyle}
        />
        <span>아이디 저장</span>
      </label>

      {mode === "signin" && (
        <button type="button" onClick={() => onModeChange("forgot")} style={forgotLinkStyle}>
          비밀번호를 잊으셨나요?
        </button>
      )}

      {mode === "signup" && (
        <>
          <label style={agreementRowStyle}>
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) => onAgreedToTermsChange(event.target.checked)}
              style={checkboxStyle}
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

          <label style={agreementRowStyle}>
            <input
              type="checkbox"
              checked={isHuman}
              onChange={(event) => onIsHumanChange(event.target.checked)}
              style={checkboxStyle}
            />
            <span>사람입니다.</span>
          </label>
        </>
      )}

      {mode === "signin" ? (
        <button onClick={onSignIn} disabled={loading} style={primaryButtonStyle(loading)}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      ) : (
        <button
          onClick={onSignUp}
          disabled={loading || !isHuman || !password || !confirmPassword || password !== confirmPassword}
          style={primaryButtonStyle(
            loading || !isHuman || !password || !confirmPassword || password !== confirmPassword
          )}
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      )}

      {message && <div style={messageBoxStyle(message)}>{message}</div>}
    </>
  );
}

const brandRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "#2b2140",
};

const subTextStyle: CSSProperties = {
  color: "#8b83b0",
  lineHeight: 1.6,
  marginTop: 6,
  marginBottom: 24,
  fontSize: 14,
  fontWeight: 600,
};

const tabGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  padding: 4,
  borderRadius: 18,
  background: "#F1EEFE",
  marginBottom: 18,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: 16,
  border: "1.5px solid #E7E3FB",
  background: "#FBFAFF",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
  color: "#2b2140",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  fontFamily: "inherit",
  resize: "vertical",
};

const primaryTabButtonStyle: CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "none",
  background: "#6C63FF",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(108,99,255,0.35)",
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: 12,
  borderRadius: 14,
  border: "none",
  background: "transparent",
  color: "#8b83b0",
  fontWeight: 800,
  cursor: "pointer",
};

const forgotLinkStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "right",
  background: "none",
  border: "none",
  color: "#6C63FF",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  marginBottom: 14,
  padding: 0,
};

const backLinkButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  background: "none",
  border: "none",
  color: "#6C63FF",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 14,
  padding: 0,
};

const agreementRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  fontSize: 13,
  color: "#6b6489",
  lineHeight: 1.5,
  marginBottom: 14,
};

const checkboxStyle: CSSProperties = {
  marginTop: 2,
  accentColor: "#6C63FF",
};

const legalLinkStyle: CSSProperties = {
  color: "#6C63FF",
  fontWeight: 700,
  textDecoration: "underline",
};

function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 15,
    borderRadius: 16,
    border: "none",
    background: loading ? "#C9C4F0" : "#6C63FF",
    color: "#fff",
    fontWeight: 800,
    fontSize: 15,
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 10px 22px rgba(108,99,255,0.38)",
  };
}

function messageBoxStyle(message: string): CSSProperties {
  const ok =
    message.includes("완료") ||
    message.includes("성공") ||
    message.includes("불러오기") ||
    message.includes("보냈습니다") ||
    message.includes("접수");

  return {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: ok ? "#EAF7EE" : "#FDECEC",
    color: ok ? "#1E8E5A" : "#D6365C",
    fontSize: 14,
    lineHeight: 1.5,
  };
}
