"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Workspace } from "@/types/app";

type HamburgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  displayName?: string;
  avatarUrl?: string | null;
  workspaces: Workspace[];
  onManageWorkspace: (id: string) => void;
  onGoProfileSettings: () => void;
  onCreateWorkspace: () => void;
  onJoinWorkspace: () => void;
  onShareApp: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
};

const BADGE_COLORS = [
  "linear-gradient(135deg, #8B83EA, #6C63FF)",
  "linear-gradient(135deg, #6FD3C7, #3FB6A8)",
  "linear-gradient(135deg, #FFB86B, #F0553D)",
  "linear-gradient(135deg, #7FA6FF, #4C6EF5)",
];

export default function HamburgerMenu({
  isOpen,
  onClose,
  workspaces,
  onManageWorkspace,
  onGoProfileSettings,
  onCreateWorkspace,
  onJoinWorkspace,
  onShareApp,
  onSignOut,
  onDeleteAccount,
}: HamburgerMenuProps) {
  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={panelHeaderStyle}>
          <span style={panelHeaderTitleStyle}>메뉴</span>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="메뉴 닫기">
            ✕
          </button>
        </div>

        <div style={panelBodyStyle}>
          <MenuGroup title="프로필" icon="👤">
            <MenuItem label="프로필 설정 (아이콘 · 비밀번호 · 닉네임)" onClick={() => { onGoProfileSettings(); onClose(); }} />
          </MenuGroup>

          <MenuGroup title="모임" icon="🏠">
            <PrimaryMenuButton label="+ 새 모임 만들기" onClick={() => { onCreateWorkspace(); onClose(); }} />
            <SecondaryMenuButton label="모임 참여하기 · 초대코드 등록" onClick={() => { onJoinWorkspace(); onClose(); }} />

            {workspaces.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={subLabelStyle}>나의 모임 관리하기 ({workspaces.length}개)</div>
                <div style={workspaceListStyle}>
                  {workspaces.map((ws, index) => (
                    <WorkspaceRow
                      key={ws.id}
                      name={ws.name}
                      colorIndex={index}
                      onClick={() => { onManageWorkspace(ws.id); onClose(); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </MenuGroup>

          <MenuGroup title="기타" icon="⚙️">
            <MenuItem label="앱 공유하기" onClick={onShareApp} icon="📤" />
            <MenuItem label="로그아웃" onClick={() => { onSignOut(); onClose(); }} icon="↩️" />
          </MenuGroup>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("정말 탈퇴하시겠어요? 이 작업은 되돌릴 수 없습니다.")) {
                onDeleteAccount();
                onClose();
              }
            }}
            style={dangerLinkStyle}
          >
            서비스 탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuGroup({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <div style={groupCardStyle}>
      <div style={groupTitleStyle}>
        <span style={groupIconStyle}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
}

function MenuItem({ label, onClick, icon }: { label: string; onClick: () => void; icon?: string }) {
  return (
    <button type="button" onClick={onClick} style={menuItemStyle}>
      {icon && <span style={menuItemIconStyle}>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}

function PrimaryMenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={primaryButtonStyle}>
      {label}
    </button>
  );
}

function SecondaryMenuButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={secondaryButtonStyle}>
      {label}
    </button>
  );
}

function WorkspaceRow({ name, colorIndex, onClick }: { name: string; colorIndex: number; onClick: () => void }) {
  const initial = name.trim().charAt(0) || "?";
  const badgeBackground = BADGE_COLORS[colorIndex % BADGE_COLORS.length];

  return (
    <button type="button" onClick={onClick} style={workspaceRowStyle}>
      <span style={{ ...workspaceBadgeStyle, background: badgeBackground }}>{initial}</span>
      <span style={workspaceNameStyle}>{name}</span>
      <span style={chevronStyle}>›</span>
    </button>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(43, 33, 64, 0.45)",
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end",
};

const panelStyle: CSSProperties = {
  width: "84%",
  maxWidth: 340,
  height: "100%",
  background: "#F8F6FF",
  boxShadow: "-14px 0 36px rgba(43, 33, 64, 0.22)",
  display: "flex",
  flexDirection: "column",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "calc(18px + env(safe-area-inset-top)) 18px 12px",
  flexShrink: 0,
};

const panelHeaderTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#2b2140",
  letterSpacing: "-0.02em",
};

const closeButtonStyle: CSSProperties = {
  width: 32,
  height: 32,
  border: "none",
  borderRadius: 10,
  background: "#fff",
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.15)",
  fontSize: 14,
  color: "#8b83b0",
  cursor: "pointer",
};

const panelBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "4px 16px 24px",
};

const groupCardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 20,
  padding: 14,
  marginBottom: 14,
  boxShadow: "0 4px 16px rgba(108, 99, 255, 0.08)",
};

const groupTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#8B83EA",
  marginBottom: 10,
  paddingLeft: 2,
};

const groupIconStyle: CSSProperties = { fontSize: 13 };

const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  padding: "11px 10px",
  fontSize: 14,
  fontWeight: 700,
  color: "#2b2140",
  cursor: "pointer",
  borderRadius: 12,
};

const menuItemIconStyle: CSSProperties = { fontSize: 14 };

const primaryButtonStyle: CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  padding: "13px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(108, 99, 255, 0.30)",
  marginBottom: 8,
};

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  border: "1px solid #E7E3FB",
  borderRadius: 14,
  background: "#FBFAFF",
  color: "#6C63FF",
  padding: "12px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const subLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: "#a8a2cf",
  padding: "2px 4px 8px",
};

const workspaceListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const workspaceRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  border: "none",
  background: "#FBFAFF",
  borderRadius: 14,
  padding: "10px 12px",
  cursor: "pointer",
  textAlign: "left",
};

const workspaceBadgeStyle: CSSProperties = {
  width: 30,
  height: 30,
  flexShrink: 0,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontSize: 13,
  fontWeight: 900,
};

const workspaceNameStyle: CSSProperties = {
  flex: 1,
  fontSize: 14,
  fontWeight: 800,
  color: "#2b2140",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chevronStyle: CSSProperties = { color: "#c7c1ee", fontSize: 16, fontWeight: 900 };

const dangerLinkStyle: CSSProperties = {
  display: "block",
  marginTop: 8,
  border: "none",
  background: "transparent",
  color: "#c7c1ee",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
};
