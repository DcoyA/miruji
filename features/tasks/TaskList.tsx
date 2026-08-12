import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { memberNameById, statusLabel, verificationLabel } from "@/lib/labels";

type TaskListProps = {
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSubmit: (task: Task) => void;
  onApprove: (task: Task) => void;
  onReject: (task: Task) => void;
  onCancel?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskList({
  tasks,
  members,
  currentMember,
  isManager,
  loading,
  onSubmit,
  onApprove,
  onReject,
  onCancel,
  onDelete,
}: TaskListProps) {
  return (
    <div style={taskListStyle}>
      {tasks.map((task) => {
        const isAssignee = task.assigned_member_id === currentMember?.id;

        const canSubmit =
          isAssignee &&
          (task.status === "todo" || task.status === "rolled_over" || task.status === "rejected");

        const canReview = isManager && task.status === "submitted" && !isAssignee;

        const canCancel =
          !isManager &&
          task.assigned_member_id === currentMember?.id &&
          task.status === "submitted";

        const canDelete =
          isManager || (!!currentMember?.id && task.created_by_member_id === currentMember.id);

        const isDone = task.status === "approved";

        function handleSubmitClick() {
          const confirmed = window.confirm(
            "제출하시겠습니까? 제출 후에는 승인 전까지 회수할 수 있습니다."
          );
          if (!confirmed) return;
          onSubmit(task);
        }

        return (
          <div key={task.id} style={taskCardStyle}>
            <div style={{ flex: 1 }}>
              <div style={taskTitleStyle}>{task.title}</div>

              <div style={taskSubTextStyle}>
                대상: {memberNameById(members, task.assigned_member_id)}
              </div>

              <div style={taskSubTextStyle}>
                인증: {verificationLabel(task.verification_type)} · 스티커{" "}
                {task.reward_points}개
              </div>

              {(canSubmit || canReview || canCancel || canDelete) && (
                <div style={actionRowStyle}>
                  {canSubmit && (
                    <button
                      onClick={handleSubmitClick}
                      disabled={loading}
                      style={submitButtonStyle}
                    >
                      제출하기
                    </button>
                  )}
                  {canCancel && onCancel && (
                    <button
                      onClick={() => onCancel(task)}
                      disabled={loading}
                      style={cancelButtonStyle}
                    >
                      회수하기
                    </button>
                  )}
                  {canReview && (
                    <>
                      <button
                        onClick={() => onApprove(task)}
                        disabled={loading}
                        style={approveButtonStyle}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => onReject(task)}
                        disabled={loading}
                        style={rejectButtonStyle}
                      >
                        반려
                      </button>
                    </>
                  )}
                  {canDelete && onDelete && (
                    <button
                      onClick={() => onDelete(task)}
                      disabled={loading}
                      style={deleteButtonStyle}
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={rightColumnStyle}>
              <span style={checkIconStyle(isDone)}>{isDone ? "✓" : ""}</span>
              <span style={statusBadgeStyle(task.status)}>
                {statusLabel(task.status)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function checkIconStyle(done: boolean): CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 900,
    color: done ? "#fff" : "transparent",
    background: done ? "#16a34a" : "#fff",
    border: done ? "none" : "2px solid #e8b9c2",
    boxShadow: done ? "0 3px 8px rgba(22,163,74,0.35)" : "none",
  };
}

function statusBadgeStyle(status: string): CSSProperties {
  const colors: Record<string, { bg: string; text: string }> = {
    todo: { bg: "#fef3c7", text: "#92400e" },
    submitted: { bg: "#ffe4e6", text: "#be123c" },
    approved: { bg: "#dcfce7", text: "#15803d" },
    rejected: { bg: "#fee2e2", text: "#b91c1c" },
    rolled_over: { bg: "#fde68a", text: "#b45309" },
    missed: { bg: "#e5e7eb", text: "#4b5563" },
  };

  const color = colors[status] || colors.todo;

  return {
    height: "fit-content",
    padding: "4px 8px",
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: "nowrap",
  };
}

const taskListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const taskCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#fff8f7",
  boxShadow: "0 3px 12px rgba(219,39,119,0.06)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const rightColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
};

const taskTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
  color: "#3f1d24",
};

const taskSubTextStyle: CSSProperties = {
  marginTop: 5,
  color: "#9f6b75",
  fontSize: 13,
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  marginTop: 10,
  flexWrap: "wrap",
};

const submitButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(225,29,72,0.30)",
};

const cancelButtonStyle: CSSProperties = {
  border: "1px solid #fbcfe8",
  borderRadius: 12,
  background: "#fff",
  color: "#db2777",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const approveButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#15803d",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const rejectButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#b91c1c",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#4b5563",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};
