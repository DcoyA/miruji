import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate } from "@/lib/date";
import { statusLabel, verificationLabel, memberNameById } from "@/lib/labels";
import TaskList from "@/features/tasks/TaskList";

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
