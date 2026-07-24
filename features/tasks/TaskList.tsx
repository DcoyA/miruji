import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { memberNameById, statusLabel, verificationLabel } from "@/lib/labels";

type TaskListProps = {
  tasks: Task[];
  members: Member[];
};

export default function TaskList({ tasks, members }: TaskListProps) {
  return (
    <div style={taskListStyle}>
      {tasks.map((task) => (
        <div key={task.id} style={taskCardStyle}>
          <div>
            <div style={taskTitleStyle}>{task.title}</div>

            <div style={taskSubTextStyle}>
              대상: {memberNameById(members, task.assigned_member_id)}
            </div>

            <div style={taskSubTextStyle}>
              인증: {verificationLabel(task.verification_type)} · 스티커{" "}
              {task.reward_points}개
            </div>
          </div>

          <span style={statusBadgeStyle(task.status)}>
            {statusLabel(task.status)}
          </span>
        </div>
      ))}
    </div>
  );
}

function statusBadgeStyle(status: string): CSSProperties {
  const colors: Record<string, { bg: string; text: string }> = {
    todo: { bg: "#fef3c7", text: "#92400e" },
    submitted: { bg: "#dbeafe", text: "#1d4ed8" },
    approved: { bg: "#dcfce7", text: "#15803d" },
    rejected: { bg: "#fee2e2", text: "#b91c1c" },
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
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const taskTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
};

const taskSubTextStyle: CSSProperties = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 13,
};
