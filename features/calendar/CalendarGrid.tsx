import type { CSSProperties } from "react";
import type { Task } from "@/types/app";
import { buildCalendarDays, toDateKey } from "@/lib/date";

type CalendarGridProps = {
  currentMonth: Date;
  selectedDate: string;
  tasks: Task[];
  onSelectDate: (date: string) => void;
};

export default function CalendarGrid({
  currentMonth,
  selectedDate,
  tasks,
  onSelectDate,
}: CalendarGridProps) {
  const days = buildCalendarDays(currentMonth);

  return (
    <section style={calendarBoxStyle}>
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

          const dayTasks = tasks.filter((task) => task.due_date === dateKey);
          const approved = dayTasks.filter(
            (task) => task.status === "approved"
          ).length;
          const pending = dayTasks.filter(
            (task) => task.status === "submitted"
          ).length;

          return (
            <button
              key={dateKey}
              onClick={() => onSelectDate(dateKey)}
              style={{
                ...calendarDayStyle,
                opacity: isCurrentMonth ? 1 : 0.35,
                borderColor: isSelected ? "#4f46e5" : "#e2e8f0",
                background: isSelected ? "#eef2ff" : "#fff",
              }}
            >
              <div style={dayNumberStyle}>{day.getDate()}</div>

              {dayTasks.length > 0 && (
                <div style={dayMetaStyle}>
                  <span>{dayTasks.length}</span>
                  {pending > 0 && <span style={pendingDotStyle} />}
                  {approved > 0 && <span style={approvedDotStyle} />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const calendarBoxStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 12,
  marginBottom: 18,
};

const weekHeaderGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  marginBottom: 8,
};

const weekHeaderStyle: CSSProperties = {
  textAlign: "center",
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 800,
};

const calendarGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
};

const calendarDayStyle: CSSProperties = {
  minHeight: 54,
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#fff",
  padding: 6,
  textAlign: "left",
  cursor: "pointer",
};

const dayNumberStyle: CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
};

const dayMetaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  marginTop: 8,
  fontSize: 11,
  color: "#64748b",
  fontWeight: 800,
};

const pendingDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  background: "#3b82f6",
};

const approvedDotStyle: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 999,
  background: "#22c55e",
};
