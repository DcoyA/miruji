"use client";

import type { CSSProperties } from "react";

type AppHeaderProps = {
  workspaceName?: string | null;
  showWorkspaceControls?: boolean;
  canSwitchWorkspace?: boolean;
  onPrevWorkspace?: () => void;
  onNextWorkspace?: () => void;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  onOpenMenu?: () => void;
};

export default function AppHeader({
  workspaceName,
  showWorkspaceControls = false,
  canSwitchWorkspace = false,
  onPrevWorkspace,
  onNextWorkspace,
  notificationsEnabled = true,
  onToggleNotifications,
  onOpenMenu,
}: AppHeaderProps) {
  return (
    <header style={topBarStyle}>
      <div style={eyebrowStyle}>미루지말자</div>

      <div style={mainRowStyle}>
        <div style={workspaceRowStyle}>
          {showWorkspaceControls && (
            <button
              type="button"
              onClick={onPrevWorkspace}
              disabled={!canSwitchWorkspace}
              style={arrowButtonStyle(canSwitchWorkspace)}
              aria-label="이전 모임"
            >
              ‹
            </button>
          )}

          <h1 style={workspaceTitleStyle}>{workspaceName || "미루지말자"}</h1>

          {showWorkspaceControls && (
            <button
              type="button"
              onClick={onNextWorkspace}
              disabled={!canSwitchWorkspace}
              style={arrowButtonStyle(canSwitchWorkspace)}
              aria-label="다음 모임"
            >
              ›
            </button>
          )}
        </div>

        <div style={rightButtonsStyle}>
          {showWorkspaceControls && (
            <button
              type="button"
              onClick={onToggleNotifications}
              style={bellButtonStyle}
              aria-label={notificationsEnabled ? "알림 끄기" : "알림 켜기"}
            >
              {notificationsEnabled ? "🔔" : "🔕"}
            </button>
          )}

          {onOpenMenu && (
            <button type="button" onClick={onOpenMenu} style={hamburgerButtonStyle} aria-label="메뉴 열기">
              ☰
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

const topBarStyle: CSSProperties = {
  marginBottom: 22,
};

const eyebrowStyle: CSSProperties = {
  color: "#e11d48",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.02em",
  marginBottom: 6,
};

const mainRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const workspaceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  minWidth: 0,
};

const workspaceTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#3f1d24",
  maxWidth: 200,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

function arrowButtonStyle(enabled: boolean): CSSProperties {
  return {
    border: "none",
    background: "transparent",
    fontSize: 22,
    fontWeight: 800,
    color: enabled ? "#be123c" : "#e8b9c2",
    cursor: enabled ? "pointer" : "default",
    padding: "0 2px",
  };
}

const rightButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexShrink: 0,
};

const bellButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
  padding: 4,
};

const hamburgerButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 22,
  color: "#3f1d24",
  cursor: "pointer",
  padding: 4,
};
