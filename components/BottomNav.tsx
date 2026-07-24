import type { CSSProperties } from "react";
import type { ActiveTab } from "@/types/app";

type BottomNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

const items: { key: ActiveTab; label: string }[] = [
  { key: "calendar", label: "캘린더" },
  { key: "missions", label: "미션" },
  { key: "rewards", label: "보상" },
  { key: "settings", label: "설정" },
];

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav style={bottomNavStyle}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          style={
            activeTab === item.key ? bottomNavActiveStyle : bottomNavButtonStyle
          }
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

const bottomNavStyle: CSSProperties = {
  position: "sticky",
  bottom: 0,
  transform: "translateY(10px)",
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  background: "#fff",
  padding: "10px 0 0",
  borderTop: "1px solid #e2e8f0",
};

const bottomNavButtonStyle: CSSProperties = {
  border: "none",
  background: "#f8fafc",
  borderRadius: 14,
  padding: "10px 4px",
  color: "#64748b",
  fontWeight: 800,
  cursor: "pointer",
};

const bottomNavActiveStyle: CSSProperties = {
  ...bottomNavButtonStyle,
  background: "#eef2ff",
  color: "#4f46e5",
};
