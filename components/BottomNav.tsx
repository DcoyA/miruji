import type { CSSProperties } from "react";
import type { ActiveTab } from "@/types/app";

type BottomNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

const items: { key: ActiveTab; label: string; icon: string }[] = [
  { key: "calendar", label: "캘린더", icon: "📅" },
  { key: "missions", label: "할 일", icon: "✅" },
  { key: "rewards", label: "보상", icon: "🎁" },
  { key: "settings", label: "설정", icon: "⚙️" },
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
  position: "sticky",
  bottom: 0,
  paddingTop: 14,
  paddingBottom: 4,
};

const bottomNavStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 6,
  background: "#ffffff",
  padding: 8,
  borderRadius: 24,
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
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
  color: "#94a3b8",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};

const bottomNavActiveStyle: CSSProperties = {
  ...bottomNavButtonStyle,
  background: "linear-gradient(135deg, #6d5bf6, #4f46e5)",
  color: "#ffffff",
  fontWeight: 800,
  boxShadow: "0 6px 14px rgba(79, 70, 229, 0.35)",
};

const iconStyle: CSSProperties = {
  fontSize: 18,
  lineHeight: 1,
};
