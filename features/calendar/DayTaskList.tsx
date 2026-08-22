"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Task, TaskTemplate } from "@/types/app";
import { formatKoreanDate, buildWeekDays, toDateKey } from "@/lib/date";
import SortableTaskList from "@/features/tasks/SortableTaskList";
import WeekView from "@/features/tasks/WeekView";
import TemplateManagerPanel from "@/features/tasks/TemplateManagerPanel";

type ViewMode = "day" | "week";

type DayTaskListProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedDate: string;
  tasks: Task[];
  monthTasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSelectDate: (dateKey: string) => void;
  onSubmitTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
  onCancelTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onAddTask: () => void;
  onSubmitWithEvidence?: (task: Task, file: File) => void;
  onSubmitWithText?: (task: Task, text: string) => void;
  onReorderTasks: (dateKey: string, orderedTaskIds: string[]) => void;
  onReorderAcrossDates: (assignments: { id: string; dueDate: string; orderIndex: number }[]) => void;
  onEditTask: (task: Task) => void;
  templates: TaskTemplate[];
  onToggleTemplateActive: (template: TaskTemplate) => void;
  onDeleteTemplate: (template: TaskTemplate) => void;
  onRolloverNow: () => void;
};

export default function DayTaskList({
  isOpen,
  onOpenChange,
  viewMode,
  onViewModeChange,
  selectedDate,
  tasks,
  monthTasks,
  members,
  currentMember,
  isManager,
  loading,
  onSelectDate,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
  onCancelTask,
  onDeleteTask,
  onAddTask,
  onSubmitWithEvidence,
  onSubmitWithText,
  onReorderTasks,
  onReorderAcrossDates,
  onEditTask,
  templates,
  onToggleTemplateActive,
  onDeleteTemplate,
  onRolloverNow,
}: DayTaskListProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);

  function handleHandlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragStartY.current = event.clientY;
    setIsDragging(true);
  }

  function handleHandlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;
    const delta = event.clientY - dragStartY.current;
    if (delta > 0) setDragOffset(delta);
  }

  function handleHandlePointerUp() {
    if (dragOffset > 90) {
      onOpenChange(false);
    }
    setDragOffset(0);
    setIsDragging(false);
    dragStartY.current = null;
  }

  const weekDays = buildWeekDays(selectedDate);

  const weekTasks = monthTasks.filter((task) =>
    weekDays.some((day) => toDateKey(day) === task.due_date)
  );
  const sortedDayTasks = sortByOrderIndex(tasks);
  const sourceTasks = viewMode === "day" ? sortedDayTasks : weekTasks;
  const approvedCount = sourceTasks.filter((task) => task.status === "approved").length;
  const totalCount = sourceTasks.length;

  function sortByOrderIndex(list: Task[]) {
    return [...list].sort((a, b) => {
      const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }

  function closePanel() {
    onOpenChange(false);
  }

  return (
    <>
      <div style={backdropStyle(isOpen)} onClick={closePanel} aria-hidden={!isOpen} />

      <div style={panelStyle(isOpen, dragOffset, isDragging)}>
        <div
          style={panelHandleStyle}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerUp}
          onPointerCancel={handleHandlePointerUp}
        />
        <div style={panelHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              {viewMode === "day" ? `${formatKoreanDate(selectedDate)} 할 일` : "이번 주 할 일"}
            </h2>
            <span style={summaryCountStyle}>{approvedCount}/{totalCount} 완료</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={onAddTask} style={addTaskButtonStyle}>
              + 추가
            </button>

            <div style={toggleGroupStyle}>
              <button
                type="button"
                onClick={() => onViewModeChange("day")}
                style={viewMode === "day" ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                일간
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("week")}
                style={viewMode === "week" ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                주간
              </button>
            </div>
            <button type="button" onClick={closePanel} style={closeButtonStyle}>
              닫기
            </button>
          </div>
        </div>

        <div style={panelBodyStyle}>
          {viewMode === "day" ? (
            tasks.length === 0 ? (
              <div style={emptyStateStyle}>이 날짜에 등록된 할 일이 없습니다.</div>
            ) : (
              <SortableTaskList
                tasks={sortedDayTasks}
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
                onReorder={(orderedIds) => onReorderTasks(selectedDate, orderedIds)}
              />
            )
          ) : (
            <WeekView
              selectedDate={selectedDate}
              tasks={monthTasks}
              members={members}
              currentMember={currentMember}
              isManager={isManager}
              loading={loading}
              onSelectDate={onSelectDate}
              onAddTask={(dateKey) => {
                onSelectDate(dateKey);
                onAddTask();
              }}
              onSubmitTask={onSubmitTask}
              onSubmitWithEvidence={onSubmitWithEvidence}
              onSubmitWithText={onSubmitWithText}
              onApproveTask={onApproveTask}
              onRejectTask={onRejectTask}
              onCancelTask={onCancelTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onReorderAcrossDates={onReorderAcrossDates}
            />
          )}

          <TemplateManagerPanel
            templates={templates}
            loading={loading}
            isManager={isManager}
            onToggleTemplateActive={onToggleTemplateActive}
            onDeleteTemplate={onDeleteTemplate}
            onRolloverNow={onRolloverNow}
          />
        </div>
      </div>
    </>
  );
}

const sectionTitleStyle: CSSProperties = { margin: "0 0 4px", fontSize: 19, letterSpacing: "-0.03em", color: "#2b2140" };

const summaryCountStyle: CSSProperties = { fontWeight: 800, color: "#6C63FF", fontSize: 13 };

const toggleGroupStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 999,
  padding: 4,
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.10)",
  flexShrink: 0,
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#6C63FF",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const toggleButtonActiveStyle: CSSProperties = {
  ...toggleButtonStyle,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(108, 99, 255, 0.30)",
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#FBFAFF",
  color: "#8b83b0",
  textAlign: "center",
};

function backdropStyle(open: boolean): CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(43,33,64,0.45)",
    opacity: open ? 1 : 0,
    pointerEvents: open ? "auto" : "none",
    transition: "opacity 0.3s ease",
    zIndex: 40,
  };
}

function panelStyle(open: boolean, dragOffset: number, isDragging: boolean): CSSProperties {
  return {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: "50vh",
    maxHeight: "80dvh",
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    boxShadow: "0 -10px 40px rgba(43,33,64,0.25)",
    transform: open ? `translateY(${dragOffset}px)` : "translateY(100%)",
    transition: isDragging ? "none" : "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
    zIndex: 41,
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
  };
}

const panelHandleStyle: CSSProperties = {
  width: 44,
  height: 5,
  borderRadius: 999,
  background: "#E7E3FB",
  margin: "8px auto 2px",
  touchAction: "none",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "6px 18px 12px",
  borderBottom: "1px solid #F1EEFE",
  flexWrap: "wrap",
  gap: 8,
};

const closeButtonStyle: CSSProperties = {
  border: "1px solid #E7E3FB",
  background: "#fff",
  color: "#8b83b0",
  borderRadius: 999,
  padding: "6px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const panelBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "14px 18px 28px",
  WebkitOverflowScrolling: "touch",
};

const addTaskButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
