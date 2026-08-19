"use client";

import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { buildWeekDays, toDateKey } from "@/lib/date";
import SortableTaskList from "@/features/tasks/SortableTaskList";

type WeekViewProps = {
  selectedDate: string;
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSelectDate: (dateKey: string) => void;
  onAddTask: (dateKey: string) => void;
  onSubmitTask: (task: Task) => void;
  onSubmitWithEvidence?: (task: Task, file: File) => void;
  onSubmitWithText?: (task: Task, text: string) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
  onCancelTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorderTasks: (dateKey: string, orderedTaskIds: string[]) => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function sortByOrderIndex(list: Task[]) {
  return [...list].sort((a, b) => {
    const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
}

export default function WeekView({
  selectedDate,
  tasks,
  members,
  currentMember,
  isManager,
  loading,
  onSelectDate,
  onAddTask,
  onSubmitTask,
  onSubmitWithEvidence,
  onSubmitWithText,
  onApproveTask,
  onRejectTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
}: WeekViewProps) {
  const todayKey = toDateKey(new Date());
  const weekDays = buildWeekDays(selectedDate);
  const weekTasks = tasks.filter((task) => weekDays.some((day) => toDateKey(day) === task.due_date));

  if (weekTasks.length === 0) {
    return (
      <div style={emptyWrapStyle}>
        <p style={emptyTextStyle}>
          이번주에 할 일이 없습니다.
          <br />
          할 일을 생성하세요.
        </p>
        <button
          type="button"
          onClick={() => onAddTask(selectedDate)}
          style={emptyAddButtonStyle}
          aria-label="할 일 추가"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      {weekDays.map((day) => {
        const dateKey = toDateKey(day);
        const dayTasks = sortByOrderIndex(tasks.filter((task) => task.due_date === dateKey));
        const approvedCount = dayTasks.filter((task) => task.status === "approved").length;
        const totalCount = dayTasks.length;
        const isToday = dateKey === todayKey;
        const isSelected = dateKey === selectedDate;

        return (
          <div key={dateKey} style={isSelected ? dayCardActiveStyle : dayCardStyle}>
            <div style={dayHeaderStyle}>
              <button type="button" onClick={() => onSelectDate(dateKey)} style={dayLabelButtonStyle}>
                <span style={dayLabelStyle}>
                  {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
                  {isToday && <span style={todayDotStyle}> ・ 오늘</span>}
                </span>
                {totalCount > 0 && (
                  <span style={dayCountStyle}>
                    {approvedCount}/{totalCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onAddTask(dateKey)}
                style={addRowButtonStyle}
                aria-label="할 일 추가"
              >
                +
              </button>
            </div>

            {dayTasks.length > 0 ? (
              <div style={dayTaskListStyle}>
                <SortableTaskList
                  tasks={dayTasks}
                  members={members}
                  currentMember={currentMember}
                  isManager={isManager}
                  loading={loading}
                  onSubmit={onSubmitTask}
                  onSubmitWithEvidence={onSubmitWithEvidence}
                  onSubmitWithText={onSubmitWithText}
                  onApprove={onApproveTask}
                  onReject={onRejectTask}
                  onCancel={onCancelTask}
                  onDelete={onDeleteTask}
                  onReorder={(orderedIds) => onReorderTasks(dateKey, orderedIds)}
                />
              </div>
            ) : (
              <div style={dayEmptyRowStyle}>등록된 할 일이 없습니다.</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const wrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10, paddingBottom: 12 };

const emptyWrapStyle: CSSProperties = {
  minHeight: 160,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: "24px 12px",
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#8b83b0",
  fontSize: 14,
  lineHeight: 1.6,
  fontWeight: 700,
};

const emptyAddButtonStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  fontSize: 22,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(108, 99, 255, 0.35)",
};

const dayCardStyle: CSSProperties = {
  borderRadius: 18,
  background: "#FBFAFF",
  boxShadow: "0 3px 12px rgba(108, 99, 255, 0.06)",
  overflow: "hidden",
};

const dayCardActiveStyle: CSSProperties = {
  ...dayCardStyle,
  background: "#F1EEFE",
  boxShadow: "0 4px 16px rgba(108, 99, 255, 0.18)",
};

const dayHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 10px 10px 14px",
};

const dayLabelButtonStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};

const dayLabelStyle: CSSProperties = { fontSize: 15, fontWeight: 800, color: "#2b2140" };

const todayDotStyle: CSSProperties = { color: "#6C63FF", fontWeight: 800, fontSize: 12 };

const dayCountStyle: CSSProperties = { fontSize: 13, fontWeight: 800, color: "#6C63FF", marginRight: 6 };

const addRowButtonStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "none",
  background: "#EDEBFF",
  color: "#6C63FF",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  flexShrink: 0,
};

const dayTaskListStyle: CSSProperties = { padding: "0 14px 14px" };

const dayEmptyRowStyle: CSSProperties = { padding: "0 14px 14px", fontSize: 12, color: "#B9B4D9" };
