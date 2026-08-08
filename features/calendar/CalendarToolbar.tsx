import type { CSSProperties } from "react";

type CalendarToolbarProps = {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export default function CalendarToolbar({
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <section style={calendarToolbarStyle}>
      <button onClick={onPrev} style={monthButtonStyle}>
        ‹
      </button>

      <div style={monthTitleStyle}>
        {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
      </div>

      <button onClick={onNext} style={monthButtonStyle}>
        ›
      </button>

      <button onClick={onToday} style={todayButtonStyle}>
        오늘
      </button>
    </section>
  );
}

const calendarToolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "44px 1fr 44px 64px",
  gap: 8,
  alignItems: "center",
  marginBottom: 12,
};

const monthButtonStyle: CSSProperties = {
  height: 44,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#fff",
  fontSize: 24,
  fontWeight: 800,
  cursor: "pointer",
};

const monthTitleStyle: CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  fontSize: 18,
};

const todayButtonStyle: CSSProperties = {
  height: 44,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
