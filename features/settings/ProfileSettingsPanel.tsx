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
};

function ResultMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p style={{ marginTop: 8, fontSize: 13, color: result.ok ? "#047857" : "#b91c1c" }}>
      {result.text}
    </p>
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
      <div style={brandLabelStyle}>미루지말자</div>
      <button type="button" onClick={onBack} style={backButtonStyle}>← 홈으로</button>
      <h1 style={titleStyle}>프로필 설정</h1>

      <section style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <Avatar src={avatarUrl} name={profileDisplayName} size={64} />
          <div style={{ flex: 1 }}>
            <h3 style={subTitleStyle}>프로필 아이콘</h3>
            <label
              style={{
                ...primaryButtonStyle(avatarUploading),
                display: "inline-block",
                width: "auto",
                padding: "10px 18px",
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
          <div style={lineStyle}>보유 스티커 <strong>{myStickerBalance}</strong>개</div>
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
            disabled={loading || !newPassword.trim() || !confirmNewPassword.trim() || newPassword !== confirmNewPassword}
            style={primaryButtonStyle(loading)}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
          <ResultMessage result={passwordMessage} />
        </div>
      </section>
    </div>
  );
}

const brandLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 900, color: "#e11d48", marginBottom: 10 };
const backButtonStyle: CSSProperties = { border: "none", background: "transparent", color: "#e11d48", fontWeight: 800, fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 };
const titleStyle: CSSProperties = { margin: "0 0 18px", fontSize: 26, fontWeight: 900, color: "#3f1d24" };
const cardStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#fff8f7", boxShadow: "0 4px 16px rgba(219,39,119,0.06)" };
const subTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#3f1d24" };
const descStyle: CSSProperties = { color: "#9f6b75", lineHeight: 1.6, marginBottom: 12, fontSize: 14 };
const lineStyle: CSSProperties = { padding: 12, background: "#fff", borderRadius: 14, color: "#5c3a41", boxShadow: "0 2px 8px rgba(219,39,119,0.05)" };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #fbcfe8", marginBottom: 12, outline: "none", fontSize: 15 };
function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: loading ? "#94a3b8" : "linear-gradient(135deg, #fb7185, #e11d48)",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 6px 14px rgba(225,29,72,0.30)",
  };
}
