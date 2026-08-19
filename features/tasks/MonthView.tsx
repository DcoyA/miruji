"use client";

import type { CSSProperties } from "react";
import type { Task } from "@/types/app";
import { buildCalendarDays, toDateKey } from "@/lib/date";

type MonthViewProps = {
  currentMonth: Date;
  selectedDate: string;
  tasks: Task[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export default function MonthView({
  currentMonth,
  selectedDate,
  tasks,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: MonthViewProps) {
  const days = buildCalendarDays(currentMonth);
  const todayKey = toDateKey(new Date());

  return (
    <section style={wrapStyle}>
      <div style={toolbarStyle}>
        <button onClick={onPrevMonth} style={monthButtonStyle} aria-label="이전 달">
          ‹
        </button>
        <div style={monthTitleStyle}>
          {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
        </div>
        <button onClick={onNextMonth} style={monthButtonStyle} aria-label="다음 달">
          ›
        </button>
        <button onClick={onToday} style={todayButtonStyle}>
          오늘
        </button>
      </div>

      <div style={weekHeaderGridStyle}>
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div key={day} style={weekHeaderStyle}>
            {day}
          </div>
        ))}
      </div>

      <div style={calendarGridStyle}>
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          const dayTasks = tasks.filter((task) => task.due_date === dateKey);
          const totalCount = dayTasks.length;
          const doneCount = dayTasks.filter((task) => task.status === "approved").length;
          const hasUnfinished = totalCount > 0 && doneCount < totalCount;

          let badgeStyle = badgeDoneStyle;
          if (hasUnfinished) {
            badgeStyle = isToday ? badgeTodayUnfinishedStyle : badgeUnfinishedStyle;
          }

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              style={{
                ...calendarDayStyle,
                opacity: isCurrentMonth ? 1 : 0.35,
                ...(isSelected ? calendarDaySelectedStyle : null),
                ...(isToday ? calendarDayTodayStyle : null),
              }}
            >
              <span style={dayNumberStyle}>{day.getDate()}</span>
              {totalCount > 0 && (
                <span style={badgeStyle}>
                  {doneCount}/{totalCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const wrapStyle: CSSProperties = { marginBottom: 20 };

const toolbarStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "40px 1fr 40px 60px",
  gap: 8,
  alignItems: "center",
  marginBottom: 14,
};

const monthButtonStyle: CSSProperties = {
  height: 40,
  border: "none",
  borderRadius: 14,
  background: "#FBFAFF",
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.10)",
  fontSize: 22,
  fontWeight: 800,
  color: "#6C63FF",
  cursor: "pointer",
};

const monthTitleStyle: CSSProperties = {
  textAlign: "center",
  fontWeight: 900,
  fontSize: 17,
  color: "#2b2140",
};

const todayButtonStyle: CSSProperties = {
  height: 40,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(108, 99, 255, 0.35)",
};

const weekHeaderGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  marginBottom: 6,
};

const weekHeaderStyle: CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  fontWeight: 800,
  color: "#ABA3CC",
  padding: "4px 0",
};

const calendarGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
};

const calendarDayStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
  minHeight: 52,
  padding: "10px 2px",
  border: "none",
  borderRadius: 14,
  background: "#fff",
  cursor: "pointer",
};

const calendarDaySelectedStyle: CSSProperties = {
  background: "#F1EEFE",
  boxShadow: "0 0 0 2px #6C63FF inset",
};

const calendarDayTodayStyle: CSSProperties = {
  boxShadow: "0 0 0 1px #8B83EA inset",
};

const dayNumberStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
  color: "#2b2140",
};

const badgeDoneStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#B9B4D9",
};

const badgeUnfinishedStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "#6C63FF",
};

const badgeTodayUnfinishedStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "#F0553D",
};
