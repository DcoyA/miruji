"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { enablePushNotifications } from "@/lib/push";

const DISMISS_KEY = "miruji_notif_prompt_dismissed";

export default function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (window.localStorage.getItem(DISMISS_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    setLoading(true);
    setMessage("");
    const result = await enablePushNotifications();
    setMessage(result.message);
    setLoading(false);
    if (result.ok) {
      window.localStorage.setItem(DISMISS_KEY, "1");
      setTimeout(() => setVisible(false), 1500);
    }
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <section style={boxStyle}>
      <div style={textWrapStyle}>
        <strong style={titleStyle}>할 일 알림을 받아보세요</strong>
        <p style={descStyle}>새 할 일이 등록되거나 승인/반려되면 바로 알려드려요.</p>
        {message && <p style={messageStyle}>{message}</p>}
      </div>
      <div style={buttonRowStyle}>
        <button onClick={handleDismiss} style={dismissButtonStyle} disabled={loading}>
          나중에
        </button>
        <button onClick={handleEnable} style={enableButtonStyle} disabled={loading}>
          {loading ? "등록 중..." : "알림 켜기"}
        </button>
      </div>
    </section>
  );
}

const boxStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 16,
  borderRadius: 18,
  background: "#eef2ff",
  border: "1px solid #c7d2fe",
  marginBottom: 14,
};
const textWrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };
const titleStyle: CSSProperties = { fontSize: 15, fontWeight: 800, color: "#3730a3" };
const descStyle: CSSProperties = { fontSize: 13, color: "#4338ca", lineHeight: 1.5, margin: 0 };
const messageStyle: CSSProperties = { fontSize: 12, color: "#4338ca", margin: 0 };
const buttonRowStyle: CSSProperties = { display: "flex", gap: 8, justifyContent: "flex-end" };
const dismissButtonStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 12,
  border: "1px solid #c7d2fe",
  background: "#fff",
  color: "#4338ca",
  fontWeight: 700,
  cursor: "pointer",
};
const enableButtonStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 12,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
