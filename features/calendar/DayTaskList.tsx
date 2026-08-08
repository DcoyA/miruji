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
  loading: boolean;
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
  loading,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
}: DayTaskListProps) {
  return (
    <section style={dayTaskSectionStyle}>
      <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 할 일</h2>

      {tasks.length === 0 ? (
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
  background: "#fff5f6",
  color: "#9f6b75",
  textAlign: "center",
};
