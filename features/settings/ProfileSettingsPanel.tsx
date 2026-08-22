"use client";

import { useState, type ChangeEvent, type CSSProperties } from "react";
import Avatar from "@/components/Avatar";

type ActionResult = { ok: boolean; text: string } | undefined;

type ProfileSettingsPanelProps = {
  profileDisplayName: string;
  avatarUrl: string | null;
  myStickerBalance: number;
  loading: boolean;
  onUploadAvatar: (file: File) => Promise<ActionResult>;
  myNickname: string;
  onMyNicknameChange: (value: string) => void;
  onSaveMyNickname: () => Promise<ActionResult>;
  recoveryEmail: string;
  onRecoveryEmailChange: (value: string) => void;
  onSaveRecoveryEmail: () => Promise<ActionResult>;
  currentNicknameLabel: string;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  onChangePassword: () => Promise<ActionResult>;
  onBack: () => void;
  onGoToRewards?: () => void;
};

function ResultMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p style={{ marginTop: 8, fontSize: 13, color: result.ok ? "#047857" : "#b91c1c" }}>
      {result.text}
    </p>
  );
}

function BackIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <path
        d="M15 18l-6-6 6-6"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProfileSettingsPanel({
  profileDisplayName,
  avatarUrl,
  myStickerBalance,
  loading,
  onUploadAvatar,
  myNickname,
  onMyNicknameChange,
  onSaveMyNickname,
  currentNicknameLabel,
  newPassword,
  onNewPasswordChange,
  onChangePassword,
  onBack,
  recoveryEmail,
  onRecoveryEmailChange,
  onSaveRecoveryEmail,
  onGoToRewards,
}: ProfileSettingsPanelProps) {
  const [avatarMessage, setAvatarMessage] = useState<ActionResult | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState<ActionResult | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<ActionResult | null>(null);
  const [recoveryEmailMessage, setRecoveryEmailMessage] = useState<ActionResult | null>(null);
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const result = await onUploadAvatar(file);
    setAvatarMessage(result ?? null);
    setAvatarUploading(false);
    event.target.value = "";
  }

  async function handleSaveNickname() {
    const result = await onSaveMyNickname();
    setNicknameMessage(result ?? null);
  }

  async function handleSaveRecoveryEmail() {
    const result = await onSaveRecoveryEmail();
    setRecoveryEmailMessage(result ?? null);
  }

  async function handleChangePassword() {
    const result = await onChangePassword();
    setPasswordMessage(result ?? null);
    if (result?.ok) setConfirmNewPassword("");
  }

  return (
    <div>
      <header style={headerWrapStyle}>
        <div style={headerTopRowStyle}>
          <button type="button" onClick={onBack} style={backButtonStyle} aria-label="홈으로">
            <BackIcon />
          </button>
          <h1 style={headerTitleStyle}>프로필 설정</h1>
        </div>
        <p style={headerSubTextStyle}>계정 정보와 보안 설정을 관리해요</p>
      </header>

      <div style={contentCardStyle}>
        <section style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <Avatar src={avatarUrl} name={profileDisplayName} size={64} />
            <div style={{ flex: 1 }}>
              <h3 style={subTitleStyle}>프로필 아이콘</h3>
              <label
                style={{
                  ...outlineButtonStyle(avatarUploading),
                  display: "inline-block",
                  width: "auto",
                  padding: "9px 18px",
                  cursor: avatarUploading ? "not-allowed" : "pointer",
                }}
              >
                {avatarUploading ? "업로드 중..." : "사진 변경"}
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={handleAvatarChange}
                  disabled={avatarUploading}
                  style={{ display: "none" }}
                />
              </label>
              <ResultMessage result={avatarMessage} />
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <h3 style={subTitleStyle}>내 스티커</h3>
            <div style={stickerRowStyle}>
              <div style={stickerLeftStyle}>
                <span style={stickerIconStyle}>⭐</span>
                <span style={stickerTextStyle}>
                  보유 스티커 <strong style={stickerCountStyle}>{myStickerBalance}</strong>개
                </span>
              </div>
              {onGoToRewards && (
                <button type="button" onClick={onGoToRewards} style={stickerUseButtonStyle}>
                  사용하기
                </button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 22 }}>
            <h3 style={subTitleStyle}>닉네임</h3>
            <p style={descStyle}>현재 닉네임: {currentNicknameLabel}</p>
            <input
              value={myNickname}
              onChange={(event) => onMyNicknameChange(event.target.value)}
              placeholder="새 닉네임"
              style={inputStyle}
            />
            <button
              onClick={handleSaveNickname}
              disabled={loading || !myNickname.trim() || myNickname.trim() === currentNicknameLabel}
              style={primaryButtonStyle(loading)}
            >
              {loading ? "저장 중..." : "닉네임 저장"}
            </button>
            <ResultMessage result={nicknameMessage} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <h3 style={subTitleStyle}>복구용 이메일</h3>
            <p style={descStyle}>
              비밀번호를 잊었을 때 재설정 코드를 받을 이메일을 등록해두세요.
            </p>
            <input
              value={recoveryEmail}
              onChange={(event) => onRecoveryEmailChange(event.target.value)}
              placeholder="example@email.com"
              type="email"
              style={inputStyle}
            />
            <button
              onClick={handleSaveRecoveryEmail}
              disabled={loading || !recoveryEmail.trim()}
              style={primaryButtonStyle(loading)}
            >
              {loading ? "저장 중..." : "복구용 이메일 저장"}
            </button>
            <ResultMessage result={recoveryEmailMessage} />
          </div>

          <div>
            <h3 style={subTitleStyle}>비밀번호 변경</h3>
            <p style={descStyle}>새 비밀번호는 6자 이상으로 입력해주세요.</p>
            <input
              value={newPassword}
              onChange={(event) => onNewPasswordChange(event.target.value)}
              placeholder="새 비밀번호"
              type="password"
              autoComplete="new-password"
              style={inputStyle}
            />
            <input
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              placeholder="새 비밀번호 확인"
              type="password"
              autoComplete="new-password"
              style={inputStyle}
            />
            {confirmNewPassword.length > 0 && newPassword !== confirmNewPassword && (
              <p style={{ marginTop: -6, marginBottom: 12, fontSize: 13, color: "#b91c1c" }}>
                비밀번호가 일치하지 않습니다.
              </p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={
                loading ||
                !newPassword.trim() ||
                !confirmNewPassword.trim() ||
                newPassword !== confirmNewPassword
              }
              style={primaryButtonStyle(loading)}
            >
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
            <ResultMessage result={passwordMessage} />
          </div>
        </section>
      </div>
    </div>
  );
}

const headerWrapStyle: CSSProperties = {
  background: "linear-gradient(135deg, #7B72F2 0%, #6C63FF 55%, #5D53E8 100%)",
  margin: "calc(-22px - env(safe-area-inset-top)) calc(-1 * var(--page-gutter)) 0",
  padding: "calc(18px + env(safe-area-inset-top)) 18px 20px",
  position: "relative",
  zIndex: 1,
};

const headerTopRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  marginBottom: 6,
};

const backButtonStyle: CSSProperties = {
  width: 36,
  height: 36,
  minWidth: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  borderRadius: 12,
  background: "rgba(255,255,255,0.18)",
  cursor: "pointer",
  flexShrink: 0,
};

const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 900,
  color: "#FFFFFF",
};

const headerSubTextStyle: CSSProperties = {
  margin: "0 0 0 48px",
  fontSize: 13,
  fontWeight: 600,
  color: "rgba(255,255,255,0.78)",
};

const contentCardStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  margin: "0 calc(-1 * var(--page-gutter))",
  background: "#FFFFFF",
  borderRadius: "24px 24px 0 0",
  padding: "22px 16px 32px",
  boxShadow: "0 -6px 20px rgba(108, 99, 255, 0.08)",
};

const sectionCardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: "#FBFAFF",
  boxShadow: "0 4px 16px rgba(108, 99, 255, 0.08)",
};

const subTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 16,
  fontWeight: 800,
  color: "#2b2140",
};

const descStyle: CSSProperties = {
  color: "#8b83b0",
  lineHeight: 1.6,
  marginBottom: 12,
  fontSize: 14,
};

const stickerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 14px",
  background: "#fff",
  borderRadius: 14,
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.08)",
};

const stickerLeftStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const stickerIconStyle: CSSProperties = { fontSize: 18 };

const stickerTextStyle: CSSProperties = {
  color: "#5c4f80",
  fontSize: 14,
};

const stickerCountStyle: CSSProperties = {
  color: "#6C63FF",
  fontSize: 16,
};

const stickerUseButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 4px 10px rgba(108, 99, 255, 0.28)",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #E5E1FB",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
  background: "#fff",
};

function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: loading ? "#D8D4F5" : "linear-gradient(135deg, #8B83EA, #6C63FF)",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 6px 14px rgba(108, 99, 255, 0.30)",
  };
}

function outlineButtonStyle(loading: boolean): CSSProperties {
  return {
    border: `1.5px solid ${loading ? "#D8D4F5" : "#6C63FF"}`,
    borderRadius: 12,
    background: "#fff",
    color: loading ? "#B7B0EE" : "#6C63FF",
    fontWeight: 800,
    fontSize: 13,
  };
}
