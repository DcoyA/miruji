import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate } from "@/lib/date";
import { statusLabel, verificationLabel, memberNameById } from "@/lib/labels";

type DayTaskListProps = {
  selectedDate: string;
  tasks: Task[];
  members: Member[];
};

export default function DayTaskList({
  selectedDate,
  tasks,
  members,
}: DayTaskListProps) {
  return (
    <section style={dayTaskSectionStyle}>
      <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션</h2>

      {tasks.length === 0 ? (
        <div style={emptyStateStyle}>이 날짜에 등록된 미션이 없습니다.</div>
      ) : (
        <TaskList tasks={tasks} members={members} />
      )}
    </section>
  );
}

function TaskList({
  tasks,
  members,
}: {
  tasks: Task[];
  members: Member[];
}) {
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

const dayTaskSectionStyle: CSSProperties = {
  marginBottom: 80,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 20,
  letterSpacing: "-0.03em",
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};

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
