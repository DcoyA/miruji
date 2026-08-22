"use client";

import type { CSSProperties } from "react";
import BrandCharacter from "@/components/BrandCharacter";
import Avatar from "@/components/Avatar";

type AppHeaderProps = {
  avatarUrl?: string | null;
  username?: string;
  nickname?: string | null;
  roleText?: string | null;
  workspaceName?: string | null;
  showWorkspaceControls?: boolean;
  canSwitchWorkspace?: boolean;
  onPrevWorkspace?: () => void;
  onNextWorkspace?: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  onOpenMenu?: () => void;
  onWorkspaceNameClick?: () => void;
};

export default function AppHeader({
  avatarUrl,
  username,
  nickname,
  roleText,
  workspaceName,
  showWorkspaceControls = false,
  canSwitchWorkspace = false,
  onPrevWorkspace,
  onNextWorkspace,
  notificationsEnabled = true,
  onToggleNotifications,
  onOpenMenu,
  onWorkspaceNameClick,
}: AppHeaderProps) {
  const showNickname = Boolean(nickname && nickname !== username);

  return (
    <header style={headerWrapStyle}>
      <div style={brandRowStyle}>
        <BrandCharacter size={24} />
        <span style={brandTextStyle}>미루지말자</span>
      </div>

      {username && (
        <div style={profileRowStyle}>
          <div style={profileLeftStyle}>
            <Avatar src={avatarUrl} name={username} size={38} />
            <div style={profileTextColStyle}>
              <span style={profileNameStyle}>
                {username}
                {showNickname && <span style={nicknameStyle}> ({nickname})</span>}
              </span>
              {roleText && <span style={roleBadgeStyle}>{roleText}</span>}
            </div>
          </div>

          {onOpenMenu && (
            <button type="button" onClick={onOpenMenu} style={iconButtonStyle} aria-label="메뉴 열기">
              <HamburgerIcon />
            </button>
          )}
        </div>
      )}

      {showWorkspaceControls && (
        <div style={workspaceRowStyle}>
          <button
            type="button"
            onClick={onPrevWorkspace}
            disabled={!canSwitchWorkspace}
            style={arrowButtonStyle(canSwitchWorkspace)}
            aria-label="이전 모임"
          >
            ‹
          </button>

          {onWorkspaceNameClick ? (
            <button
              type="button"
              onClick={onWorkspaceNameClick}
              style={workspaceTitleButtonStyle}
              aria-label="모임 이름 변경"
            >
              {workspaceName || "미루지말자"}
            </button>
          ) : (
            <h1 style={workspaceTitleStyle}>{workspaceName || "미루지말자"}</h1>
          )}

          <button
            type="button"
            onClick={onNextWorkspace}
            disabled={!canSwitchWorkspace}
            style={arrowButtonStyle(canSwitchWorkspace)}
            aria-label="다음 모임"
          >
            ›
          </button>

          <button
            type="button"
            onClick={onToggleNotifications}
            style={iconButtonStyle}
            aria-label={notificationsEnabled ? "알림 끄기" : "알림 켜기"}
          >
            <BellIcon filled={notificationsEnabled} />
          </button>
        </div>
      )}
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M4 12H20" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
      <path d="M4 18H20" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 10a6 6 0 1 1 12 0v4l1.6 2.4a1 1 0 0 1-.8 1.6H5.2a1 1 0 0 1-.8-1.6L6 14z"
        fill={filled ? "#FFFFFF" : "none"}
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

const headerWrapStyle: CSSProperties = {
  background: "linear-gradient(180deg, #7B72F2 0%, #6C63FF 100%)",
  margin: "calc(-22px - env(safe-area-inset-top)) calc(-1 * var(--page-gutter)) 0",
  padding: "calc(18px + env(safe-area-inset-top)) 18px 14px",
  borderRadius: 0,
  position: "relative",
  zIndex: 1,
};

const brandRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginBottom: 14,
};

const brandTextStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "rgba(255,255,255,0.75)",
  letterSpacing: "0.02em",
};

const profileRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
};

const profileLeftStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, minWidth: 0 };

const profileTextColStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };

const profileNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "#FFFFFF",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const nicknameStyle: CSSProperties = { fontWeight: 600, color: "rgba(255,255,255,0.7)" };

const roleBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "2px 9px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.2)",
  color: "#FFFFFF",
  fontSize: 11,
  fontWeight: 800,
};

const iconButtonStyle: CSSProperties = {
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

const workspaceRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr 28px 36px",
  gap: 6,
  alignItems: "center",
  background: "rgba(255,255,255,0.12)",
  borderRadius: 16,
  padding: "8px 8px",
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: "#FFFFFF",
  textAlign: "center",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const workspaceTitleButtonStyle: CSSProperties = {
  ...workspaceTitleStyle,
  width: "100%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
};

function arrowButtonStyle(enabled: boolean): CSSProperties {
  return {
    border: "none",
    background: "transparent",
    fontSize: 18,
    fontWeight: 800,
    color: enabled ? "#FFFFFF" : "rgba(255,255,255,0.35)",
    cursor: enabled ? "pointer" : "default",
    padding: 0,
  };
}
