"use client";

import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import TaskList from "@/features/tasks/TaskList";
import { useDragReorder } from "@/features/tasks/useDragReorder";

type SortableTaskListProps = {
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSubmit: (task: Task) => void;
  onSubmitWithEvidence?: (task: Task, file: File) => void;
  onSubmitWithText?: (task: Task, text: string) => void;
  onApprove: (task: Task) => void;
  onReject: (task: Task) => void;
  onCancel?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onReorder: (orderedTaskIds: string[]) => void;
};

export default function SortableTaskList({
  tasks,
  members,
  currentMember,
  isManager,
  loading,
  onSubmit,
  onSubmitWithEvidence,
  onSubmitWithText,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  onEdit,
  onReorder,
}: SortableTaskListProps) {
  const { order, draggingId, registerItemRef, getHandleProps } = useDragReorder(
    tasks,
    (task) => task.id,
    onReorder
  );

  if (tasks.length <= 1) {
    return (
      <TaskList
        tasks={tasks}
        members={members}
        currentMember={currentMember}
        isManager={isManager}
        loading={loading}
        onSubmit={onSubmit}
        onSubmitWithEvidence={onSubmitWithEvidence}
        onSubmitWithText={onSubmitWithText}
        onApprove={onApprove}
        onReject={onReject}
        onCancel={onCancel}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );
  }

  return (
    <div style={listWrapStyle}>
      {order.map((task) => (
        <div key={task.id} ref={registerItemRef(task.id)} style={rowStyle(draggingId === task.id)}>
          <button type="button" {...getHandleProps(task.id)} style={handleStyle} aria-label="순서 변경">
            ⠿
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TaskList
              tasks={[task]}
              members={members}
              currentMember={currentMember}
              isManager={isManager}
              loading={loading}
              onSubmit={onSubmit}
              onSubmitWithEvidence={onSubmitWithEvidence}
              onSubmitWithText={onSubmitWithText}
              onApprove={onApprove}
              onReject={onReject}
              onCancel={onCancel}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const listWrapStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

function rowStyle(isDragging: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "flex-start",
    gap: 4,
    position: "relative",
    zIndex: isDragging ? 5 : 1,
    opacity: isDragging ? 0.85 : 1,
  };
}

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
