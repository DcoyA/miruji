import type { CSSProperties } from "react";
import type { ActiveTab } from "@/types/app";

type BottomNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

const items: { key: ActiveTab; label: string; icon: string }[] = [
  { key: "tasks", label: "할 일", icon: "✅" },
  { key: "members", label: "참여자", icon: "👥" },
  { key: "rewards", label: "보상", icon: "🎁" },
];

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav style={bottomNavWrapStyle}>
      <div style={bottomNavStyle}>
        {items.map((item) => {
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              style={active ? bottomNavActiveStyle : bottomNavButtonStyle}
            >
              <span style={iconStyle}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const bottomNavWrapStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  padding: "0 16px calc(16px + env(safe-area-inset-bottom))",
  pointerEvents: "none",
  zIndex: 30,
};

const bottomNavStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 6,
  background: "#ffffff",
  padding: 8,
  borderRadius: 24,
  boxShadow: "0 10px 30px rgba(108, 99, 255, 0.18)",
  pointerEvents: "auto",
};

const bottomNavButtonStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 3,
  border: "none",
  background: "transparent",
  borderRadius: 18,
  padding: "8px 4px",
  color: "#a8a2cf",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const bottomNavActiveStyle: CSSProperties = {
  ...bottomNavButtonStyle,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#ffffff",
  fontWeight: 800,
  boxShadow: "0 6px 14px rgba(108, 99, 255, 0.35)",
};

const iconStyle: CSSProperties = { fontSize: 18, lineHeight: 1 };
