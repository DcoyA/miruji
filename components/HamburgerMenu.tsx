"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Workspace } from "@/types/app";

type HamburgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  onSelectWorkspace: (id: string) => void;
  onGoProfileSettings: () => void;
  onCreateWorkspace: () => void;
  onJoinWorkspace: () => void;
  onShareApp: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
};

export default function HamburgerMenu({
  isOpen,
  onClose,
  workspaces,
  onSelectWorkspace,
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
        <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="메뉴 닫기">✕</button>

        <MenuGroup title="프로필">
          <MenuItem label="프로필 설정 (아이콘 · 비밀번호 · 닉네임)" onClick={() => { onGoProfileSettings(); onClose(); }} />
        </MenuGroup>

        <MenuGroup title="모임">
          <MenuItem label="새 모임 만들기" onClick={() => { onCreateWorkspace(); onClose(); }} />
          {workspaces.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={subLabelStyle}>나의 모임 관리하기 ({workspaces.length}개)</div>
              {workspaces.map((ws) => (
                <MenuItem key={ws.id} label={`ㄴ ${ws.name}`} onClick={() => { onSelectWorkspace(ws.id); onClose(); }} indent />
              ))}
            </div>
          )}
          <MenuItem label="모임 참여하기: 초대코드 등록" onClick={() => { onJoinWorkspace(); onClose(); }} />
        </MenuGroup>

        <MenuGroup title="기타">
          <MenuItem label="앱 공유하기" onClick={onShareApp} />
          <MenuItem label="로그아웃" onClick={() => { onSignOut(); onClose(); }} />
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
          탈퇴하기
        </button>
      </div>
    </div>
  );
}

function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={groupTitleStyle}>{title}</div>
      {children}
    </div>
  );
}

function MenuItem({ label, onClick, indent }: { label: string; onClick: () => void; indent?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ ...menuItemStyle, paddingLeft: indent ? 26 : 14 }}>
      {label}
    </button>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 10, 12, 0.35)",
  zIndex: 1000,
  display: "flex",
  justifyContent: "flex-end",
};
const panelStyle: CSSProperties = {
  width: "82%",
  maxWidth: 340,
  height: "100%",
  background: "#fffaf9",
  padding: "20px 16px",
  boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
  overflowY: "auto",
};
const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  color: "#3f1d24",
  cursor: "pointer",
  marginBottom: 14,
};
const groupTitleStyle: CSSProperties = { fontSize: 12, fontWeight: 800, color: "#9f6b75", marginBottom: 8, paddingLeft: 14 };
const subLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 700, color: "#5c3a41", padding: "8px 14px" };
const menuItemStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  border: "none",
  background: "transparent",
  padding: "12px 14px",
  fontSize: 15,
  fontWeight: 700,
  color: "#3f1d24",
  cursor: "pointer",
  borderRadius: 12,
};
const dangerLinkStyle: CSSProperties = {
  display: "block",
  marginTop: 20,
  border: "none",
  background: "transparent",
  color: "#b91c1c",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "center",
  width: "100%",
};
