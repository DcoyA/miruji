"use client";

import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import SortableTaskList from "@/features/tasks/SortableTaskList";

type DayViewProps = {
  selectedDate: string;
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onAddTask: () => void;
  onSubmitTask: (task: Task) => void;
  onSubmitWithEvidence?: (task: Task, file: File) => void;
  onSubmitWithText?: (task: Task, text: string) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
  onCancelTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorderTasks: (dateKey: string, orderedTaskIds: string[]) => void;
};

export default function DayView({
  selectedDate,
  tasks,
  members,
  currentMember,
  isManager,
  loading,
  onAddTask,
  onSubmitTask,
  onSubmitWithEvidence,
  onSubmitWithText,
  onApproveTask,
  onRejectTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
}: DayViewProps) {
  const sorted = [...tasks].sort((a, b) => {
    const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
  const approvedCount = sorted.filter((task) => task.status === "approved").length;

  if (sorted.length === 0) {
    return (
      <div style={emptyWrapStyle}>
        <p style={emptyTextStyle}>
          오늘 할 일이 없습니다.
          <br />
          할 일을 생성하세요.
        </p>
        <button type="button" onClick={onAddTask} style={emptyAddButtonStyle} aria-label="할 일 추가">
          +
        </button>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div style={headerRowStyle}>
        <span style={summaryTextStyle}>
          {approvedCount}/{sorted.length} 완료
        </span>
        <button type="button" onClick={onAddTask} style={addButtonStyle}>
          + 추가
        </button>
      </div>
      <SortableTaskList
        tasks={sorted}
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
        onReorder={(orderedIds) => onReorderTasks(selectedDate, orderedIds)}
      />
    </div>
  );
}

const wrapStyle: CSSProperties = { paddingBottom: 12 };

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const summaryTextStyle: CSSProperties = { fontSize: 13, fontWeight: 800, color: "#6C63FF" };

const addButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const emptyWrapStyle: CSSProperties = {
  minHeight: 200,
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
