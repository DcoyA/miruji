"use client";

import type { CSSProperties } from "react";

export type CalendarViewMode = "month" | "week" | "day";

type ViewSwitchTabsProps = {
  mode: CalendarViewMode;
  onChange: (mode: CalendarViewMode) => void;
};

const ITEMS: { key: CalendarViewMode; label: string }[] = [
  { key: "month", label: "월" },
  { key: "week", label: "주" },
  { key: "day", label: "일" },
];

export default function ViewSwitchTabs({ mode, onChange }: ViewSwitchTabsProps) {
  return (
    <div style={wrapStyle}>
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          style={mode === item.key ? activeButtonStyle : buttonStyle}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

const wrapStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 999,
  padding: 4,
  boxShadow: "0 2px 8px rgba(219,39,119,0.08)",
  marginBottom: 14,
};

const buttonStyle: CSSProperties = {
  flex: 1,
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#db2777",
  padding: "8px 0",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(225,29,72,0.30)",
};
