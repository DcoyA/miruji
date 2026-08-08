"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate, buildWeekDays, toDateKey } from "@/lib/date";
import TaskList from "@/features/tasks/TaskList";

type ViewMode = "day" | "week";

type DayTaskListProps = {
  selectedDate: string;
  tasks: Task[];
  monthTasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSelectDate: (dateKey: string) => void;
  onSubmitTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function DayTaskList({
  selectedDate,
  tasks,
  monthTasks,
  members,
  currentMember,
  isManager,
  loading,
  onSelectDate,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
}: DayTaskListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const todayKey = toDateKey(new Date());
  const weekDays = buildWeekDays(selectedDate);

  return (
    <section style={dayTaskSectionStyle}>
      <div style={headerRowStyle}>
        <h2 style={sectionTitleStyle}>
          {viewMode === "day" ? `${formatKoreanDate(selectedDate)} 할 일` : "이번 주 할 일"}
        </h2>
        <div style={toggleGroupStyle}>
          <button
            type="button"
            onClick={() => setViewMode("day")}
            style={viewMode === "day" ? toggleButtonActiveStyle : toggleButtonStyle}
          >
            일간
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            style={viewMode === "week" ? toggleButtonActiveStyle : toggleButtonStyle}
          >
            주간
          </button>
        </div>
      </div>

      {viewMode === "day" ? (
        tasks.length === 0 ? (
          <div style={emptyStateStyle}>이 날짜에 등록된 할 일이 없습니다.</div>
        ) : (
          <TaskList
            tasks={tasks}
            members={members}
            currentMember={currentMember}
            isManager={isManager}
            loading={loading}
            onSubmit={onSubmitTask}
            onApprove={onApproveTask}
            onReject={onRejectTask}
          />
        )
      ) : (
        <div style={weekListStyle}>
          {weekDays.map((day) => {
            const dateKey = toDateKey(day);
            const dayTasks = monthTasks.filter((task) => task.due_date === dateKey);
            const approvedCount = dayTasks.filter((task) => task.status === "approved").length;
            const totalCount = dayTasks.length;
            const isPast = dateKey < todayKey;
            const isToday = dateKey === todayKey;
            const hasOverdueUnfinished = isPast && dayTasks.some((task) => task.status !== "approved");
            const isSelected = dateKey === selectedDate;

            return (
              <div key={dateKey} style={isSelected ? weekDayCardActiveStyle : weekDayCardStyle}>
                <button type="button" onClick={() => onSelectDate(dateKey)} style={weekDayHeaderStyle}>
                  <span style={weekDayLabelStyle}>
                    {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
                    {isToday && <span style={todayDotStyle}> ・ 오늘</span>}
                  </span>
                  {totalCount > 0 ? (
                    <span style={hasOverdueUnfinished ? weekDayCountOverdueStyle : weekDayCountStyle}>
                      {approvedCount}/{totalCount}
                    </span>
                  ) : (
                    <span style={weekDayCountEmptyStyle}>-</span>
                  )}
                </button>

                {dayTasks.length > 0 && (
                  <div style={weekDayTaskListStyle}>
                    <TaskList
                      tasks={dayTasks}
                      members={members}
                      currentMember={currentMember}
                      isManager={isManager}
                      loading={loading}
                      onSubmit={onSubmitTask}
                      onApprove={onApproveTask}
                      onReject={onRejectTask}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const dayTaskSectionStyle: CSSProperties = { marginBottom: 80 };

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 20, letterSpacing: "-0.03em", color: "#3f1d24" };

const toggleGroupStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 999,
  padding: 4,
  boxShadow: "0 2px 8px rgba(219,39,119,0.08)",
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#db2777",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const toggleButtonActiveStyle: CSSProperties = {
  ...toggleButtonStyle,
  background: "linear-gradient(135deg, #ec4899, #db2777)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(219,39,119,0.30)",
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#fff5f6",
  color: "#9f6b75",
  textAlign: "center",
};

const weekListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const weekDayCardStyle: CSSProperties = {
  borderRadius: 18,
  background: "#fff8f7",
  boxShadow: "0 3px 12px rgba(219,39,119,0.06)",
  overflow: "hidden",
};

const weekDayCardActiveStyle: CSSProperties = {
  ...weekDayCardStyle,
  boxShadow: "0 4px 16px rgba(219,39,119,0.20)",
  background: "#fff0f2",
};

const weekDayHeaderStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const weekDayLabelStyle: CSSProperties = { fontSize: 15, fontWeight: 800, color: "#3f1d24" };

const todayDotStyle: CSSProperties = { color: "#e11d48", fontWeight: 800, fontSize: 12 };

const weekDayCountStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#e11d48" };

const weekDayCountOverdueStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#dc2626" };

const weekDayCountEmptyStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: "#d8b4bc" };

const weekDayTaskListStyle: CSSProperties = { padding: "0 14px 14px" };
