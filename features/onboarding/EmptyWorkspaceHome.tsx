"use client";

import type { CSSProperties } from "react";
import Avatar from "@/components/Avatar";

type EmptyWorkspaceHomeProps = {
  displayName: string;
  avatarUrl: string | null;
  onOpenMenu: () => void;
  onOpenPlus: () => void;
};

export default function EmptyWorkspaceHome({
  displayName,
  avatarUrl,
  onOpenMenu,
  onOpenPlus,
}: EmptyWorkspaceHomeProps) {
  return (
    <div style={wrapStyle}>
      <header>
        <div style={brandLabelStyle}>미루지말자</div>
        <div style={headerBottomRowStyle}>
          <div style={profileChipStyle}>
            <Avatar src={avatarUrl} name={displayName} size={28} />
            <span style={profileNameStyle}>{displayName}</span>
          </div>
          <button type="button" onClick={onOpenMenu} style={menuButtonStyle} aria-label="메뉴 열기">
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
            <span style={menuBarStyle} />
          </button>
        </div>
      </header>

      <div style={emptyBodyStyle}>
        <h2 style={emptyTitleStyle}>모임이 없어요</h2>
        <p style={emptyTextStyle}>
          모임을 만들고<br />함께할 가족/친구를 초대하세요.
        </p>
        <button type="button" onClick={onOpenPlus} style={plusButtonStyle} aria-label="모임 만들기 또는 참여하기">
          +
        </button>
      </div>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100vh - 32px - 44px)",
};
const brandLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#6C63FF",
  marginBottom: 10,
};
const headerBottomRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 30,
};
const profileChipStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px 6px 6px",
  borderRadius: 999,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.08)",
};
const profileNameStyle: CSSProperties = { fontWeight: 800, fontSize: 14, color: "#2b2140" };
const menuButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 14,
  border: "none",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  cursor: "pointer",
};
const menuBarStyle: CSSProperties = { width: 18, height: 2, borderRadius: 2, background: "#2b2140" };
const emptyBodyStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 22,
  paddingBottom: 60,
};
const emptyTitleStyle: CSSProperties = { margin: 0, fontSize: 20, fontWeight: 900, color: "#2b2140" };
const emptyTextStyle: CSSProperties = { margin: 0, color: "#8b83b0", lineHeight: 1.6, fontSize: 15 };
const plusButtonStyle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 20,
  border: "none",
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  fontSize: 30,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(108, 99, 255, 0.30)",
};
