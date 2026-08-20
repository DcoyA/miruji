"use client";

import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { buildWeekDays, toDateKey } from "@/lib/date";
import TaskList from "@/features/tasks/TaskList";
import { useDragReorder } from "@/features/tasks/useDragReorder";

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
  onEditTask: (task: Task) => void;
  onReorderAcrossDates: (assignments: { id: string; dueDate: string; orderIndex: number }[]) => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type Row =
  | { id: string; kind: "header"; dateKey: string }
  | { id: string; kind: "task"; task: Task; dateKey: string };

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
  onEditTask,
  onReorderAcrossDates,
}: WeekViewProps) {
  const todayKey = toDateKey(new Date());
  const weekDays = buildWeekDays(selectedDate);
  const weekTasks = tasks.filter((task) => weekDays.some((day) => toDateKey(day) === task.due_date));

  const rows: Row[] = [];
  weekDays.forEach((day) => {
    const dateKey = toDateKey(day);
    rows.push({ id: `header-${dateKey}`, kind: "header", dateKey });
    const dayTasks = sortByOrderIndex(tasks.filter((task) => task.due_date === dateKey));
    dayTasks.forEach((task) => {
      rows.push({ id: task.id, kind: "task", task, dateKey });
    });
  });

  function handleCommit(orderedIds: string[]) {
    let currentDateKey = weekDays.length > 0 ? toDateKey(weekDays[0]) : selectedDate;
    let indexInDate = 0;
    const assignments: { id: string; dueDate: string; orderIndex: number }[] = [];

    orderedIds.forEach((id) => {
      if (id.startsWith("header-")) {
        currentDateKey = id.replace("header-", "");
        indexInDate = 0;
        return;
      }
      assignments.push({ id, dueDate: currentDateKey, orderIndex: indexInDate });
      indexInDate += 1;
    });

    onReorderAcrossDates(assignments);
  }

  const { order, draggingId, getItemStyle, registerItemRef, getHandleProps } = useDragReorder(
    rows,
    (row) => row.id,
    handleCommit
  );

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
      {order.map((row) => {
        if (row.kind === "header") {
          const day = weekDays.find((item) => toDateKey(item) === row.dateKey);
          if (!day) return null;
          const dayTasksCount = tasks.filter((task) => task.due_date === row.dateKey);
          const approvedCount = dayTasksCount.filter((task) => task.status === "approved").length;
          const totalCount = dayTasksCount.length;
          const isToday = row.dateKey === todayKey;
          const isSelected = row.dateKey === selectedDate;

          return (
            <div
              key={row.id}
              ref={registerItemRef(row.id)}
              style={{ ...(isSelected ? dayHeaderRowActiveStyle : dayHeaderRowStyle), ...getItemStyle(row.id) }}
            >
              <button type="button" onClick={() => onSelectDate(row.dateKey)} style={dayLabelButtonStyle}>
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
                onClick={() => onAddTask(row.dateKey)}
                style={addRowButtonStyle}
                aria-label="할 일 추가"
              >
                +
              </button>
            </div>
          );
        }

        return (
          <div key={row.id} ref={registerItemRef(row.id)} style={{ ...taskRowBaseStyle, ...getItemStyle(row.id) }}>
            <button type="button" {...getHandleProps(row.id)} style={handleStyle} aria-label="순서 변경">
              ⠿
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TaskList
                tasks={[row.task]}
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
                onEdit={onEditTask}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const wrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12 };

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

const dayHeaderRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 4px 6px",
  marginTop: 6,
};

const dayHeaderRowActiveStyle: CSSProperties = {
  ...dayHeaderRowStyle,
  background: "#F1EEFE",
  borderRadius: 12,
  padding: "10px 10px 6px",
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

const dayLabelStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#2b2140" };

const todayDotStyle: CSSProperties = { color: "#6C63FF", fontWeight: 800, fontSize: 12 };

const dayCountStyle: CSSProperties = { fontSize: 13, fontWeight: 800, color: "#6C63FF", marginRight: 6 };

const addRowButtonStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  border: "none",
  background: "#EDEBFF",
  color: "#6C63FF",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  flexShrink: 0,
};

const taskRowBaseStyle: CSSProperties = { display: "flex", alignItems: "flex-start", gap: 4 };

const handleStyle: CSSProperties = {
  width: 26,
  height: 44,
  flexShrink: 0,
  border: "none",
  background: "transparent",
  color: "#C7C1EE",
  fontSize: 18,
  fontWeight: 900,
  cursor: "grab",
  touchAction: "none",
  userSelect: "none",
  marginTop: 14,
};
