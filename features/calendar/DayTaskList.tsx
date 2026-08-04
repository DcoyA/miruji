import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate } from "@/lib/date";
import TaskList from "@/features/tasks/TaskList";

type DayTaskListProps = {
  selectedDate: string;
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  onSubmitTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
};

export default function DayTaskList({
  selectedDate,
  tasks,
  members,
  currentMember,
  isManager,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
}: DayTaskListProps) {
  return (
    <section style={dayTaskSectionStyle}>
      <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션</h2>

      {tasks.length === 0 ? (
        <div style={emptyStateStyle}>이 날짜에 등록된 미션이 없습니다.</div>
      ) : (
        <TaskList
          tasks={tasks}
          members={members}
          currentMember={currentMember}
          isManager={isManager}
          onSubmit={onSubmitTask}
          onApprove={onApproveTask}
          onReject={onRejectTask}
        />
      )}
    </section>
  );
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
