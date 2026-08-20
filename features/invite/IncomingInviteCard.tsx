"use client";

import { useEffect, useState, type CSSProperties } from "react";
import BrandCharacter from "@/components/BrandCharacter";

type IncomingInvitePreview = {
  workspaceName: string;
  invitedBy: string | null;
  role: string;
  suggestedName: string | null;
  expiresAt: string;
};

type IncomingInviteCardProps = {
  status: "loading" | "ready" | "invalid";
  invite: IncomingInvitePreview | null;
  loading: boolean;
  onAccept: () => Promise<{ ok: boolean; text: string } | undefined>;
  onDecline: () => void;
  onClose: () => void;
};

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function IncomingInviteCard({
  status,
  invite,
  loading,
  onAccept,
  onDecline,
  onClose,
}: IncomingInviteCardProps) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleAccept() {
    const result = await onAccept();
    setToast(result?.ok ? `'${invite?.workspaceName}' 모임에 참여했어요.` : result?.text || "참여에 실패했어요.");
    if (result?.ok) {
      setTimeout(onClose, 1600);
    }
  }

  function handleDecline() {
    setToast("모임 초대를 거절했어요. 언제든 다시 참여할 수 있어요.");
    onDecline();
    setTimeout(onClose, 1600);
  }

  if (toast) {
    return (
      <div style={backdropStyle}>
        <div style={toastCardStyle}>{toast}</div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div style={backdropStyle}>
        <div style={toastCardStyle}>
          코드가 만료됐어요.
          <br />
          초대를 다시 받아주세요.
          <button type="button" onClick={onClose} style={toastCloseButtonStyle}>
            닫기
          </button>
        </div>
      </div>
    );
  }

  if (status !== "ready" || !invite) return null;

  const remainingDays = daysUntil(invite.expiresAt);

  return (
    <div style={backdropStyle}>
      <div style={cardStyle}>
        <button type="button" onClick={handleDecline} aria-label="닫기" style={closeButtonStyle}>
          ✕
        </button>

        <div style={brandRowStyle}>
          <BrandCharacter size={22} />
          <span style={brandTextStyle}>미루지말자</span>
        </div>

        <h2 style={titleStyle}>초대를 받았어요</h2>

        <div style={infoBoxStyle}>
          <div style={infoRowStyle}>
            초대자: <strong>{invite.invitedBy || "알 수 없음"}</strong>
          </div>
          <div style={infoRowStyle}>
            모임명: <strong>{invite.workspaceName}</strong>
          </div>
        </div>

        <p style={codeHintStyle}>초대 받은 코드 6자리를 확인하세요.</p>
        <div style={codeBoxStyle}>
          코드 유효기간 D-{remainingDays}
        </div>

        <div style={buttonRowStyle}>
          <button type="button" onClick={handleAccept} disabled={loading} style={acceptButtonStyle(loading)}>
            참여하기
          </button>
          <button type="button" onClick={handleDecline} disabled={loading} style={declineButtonStyle}>
            거절하기
          </button>
        </div>
      </div>
    </div>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: 20,
};

const cardStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 340,
  background: "linear-gradient(180deg, #FFF8E1, #FFECB3)",
  borderRadius: 24,
  padding: "28px 22px 24px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
};

const closeButtonStyle: CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  border: "none",
  background: "transparent",
  fontSize: 16,
  color: "#7c6a2e",
  cursor: "pointer",
};

const brandRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 6, marginBottom: 14 };
const brandTextStyle: CSSProperties = { fontWeight: 900, fontSize: 14, color: "#4b3f1a" };
const titleStyle: CSSProperties = { margin: "0 0 16px", fontSize: 20, fontWeight: 900, color: "#3f1d24" };

const infoBoxStyle: CSSProperties = { marginBottom: 16 };
const infoRowStyle: CSSProperties = { fontSize: 14, color: "#5c4a1e", marginBottom: 4 };

const codeHintStyle: CSSProperties = { fontSize: 12, color: "#8a7845", marginBottom: 8 };
const codeBoxStyle: CSSProperties = {
  background: "rgba(255,255,255,0.6)",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 12,
  fontWeight: 800,
  color: "#a05a00",
  marginBottom: 20,
  textAlign: "center",
};

const buttonRowStyle: CSSProperties = { display: "flex", gap: 10 };

function acceptButtonStyle(loading: boolean): CSSProperties {
  return {
    flex: 1,
    padding: 13,
    borderRadius: 14,
    border: "none",
    background: loading ? "#c9c2a8" : "#3f1d24",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
  };
}

const declineButtonStyle: CSSProperties = {
  flex: 1,
  padding: 13,
  borderRadius: 14,
  border: "1.5px solid #3f1d24",
  background: "transparent",
  color: "#3f1d24",
  fontWeight: 800,
  cursor: "pointer",
};

const toastCardStyle: CSSProperties = {
  background: "#111827",
  color: "#fff",
  padding: "22px 26px",
  borderRadius: 18,
  fontSize: 14,
  fontWeight: 700,
  textAlign: "center",
  lineHeight: 1.6,
  maxWidth: 280,
};

const toastCloseButtonStyle: CSSProperties = {
  display: "block",
  margin: "14px auto 0",
  border: "none",
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 10,
  fontSize: 12,
  cursor: "pointer",
};
