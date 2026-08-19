"use client";

import type { CSSProperties } from "react";
import type { Member, Task, TaskTemplate } from "@/types/app";
import { formatKoreanDate, buildWeekDays, toDateKey } from "@/lib/date";
import TaskList from "@/features/tasks/TaskList";
import SortableTaskList from "@/features/tasks/SortableTaskList";
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
  onEditTask: (task: Task) => void;
  templates: TaskTemplate[];
  onToggleTemplateActive: (template: TaskTemplate) => void;
  onDeleteTemplate: (template: TaskTemplate) => void;
  onRolloverNow: () => void;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

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
  onEditTask,
  templates,
  onToggleTemplateActive,
  onDeleteTemplate,
  onRolloverNow,
}: DayTaskListProps) {
  const todayKey = toDateKey(new Date());
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

      <div style={panelStyle(isOpen)}>
        <div style={panelHandleStyle} />
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
                onReorder={(orderedIds) => onReorderTasks(selectedDate, orderedIds)}
                onEdit={onEditTask}
              />
            )
          ) : (
            <div style={weekListStyle}>
              {weekDays.map((day) => {
                const dateKey = toDateKey(day);
                const dayTasks = sortByOrderIndex(monthTasks.filter((task) => task.due_date === dateKey));
                const dayApprovedCount = dayTasks.filter((task) => task.status === "approved").length;
                const dayTotalCount = dayTasks.length;
                const isPast = dateKey < todayKey;
                const isToday = dateKey === todayKey;
                const hasOverdueUnfinished = isPast && dayTasks.some((task) => task.status !== "approved");
                const isSelected = dateKey === selectedDate;

                return (
                  <div key={dateKey} style={isSelected ? weekDayCardActiveStyle : weekDayCardStyle}>
                    <button type="button" onClick={() => onSelectDate(dateKey)} style={weekDayHeaderStyle}>
                      <span style={weekDayLabelStyle}>
                        {WEEKDAY_LABELS[day.getDay()]} {day.getDate()}
                        {isToday && <span style={todayDotStyle}> ・ 오늘</span>}
                      </span>
                      {dayTotalCount > 0 ? (
                        <span style={hasOverdueUnfinished ? weekDayCountOverdueStyle : weekDayCountStyle}>
                          {dayApprovedCount}/{dayTotalCount}
                        </span>
                      ) : (
                        <span style={weekDayCountEmptyStyle}>-</span>
                      )}
                    </button>

                    {dayTasks.length > 0 && (
                      <div style={weekDayTaskListStyle}>
                        <SortableTaskList
                          tasks={dayTasks}
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
                          onReorder={(orderedIds) => onReorderTasks(dateKey, orderedIds)}
                          onEdit={onEditTask}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

function panelStyle(open: boolean): CSSProperties {
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
    transform: open ? "translateY(0)" : "translateY(100%)",
    transition: "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)",
    zIndex: 41,
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
    paddingTop: "env(safe-area-inset-top)",
  };
}

const panelHandleStyle: CSSProperties = {
  width: 44,
  height: 5,
  borderRadius: 999,
  background: "#E7E3FB",
  margin: "10px auto 4px",
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

const weekListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 };

const weekDayCardStyle: CSSProperties = {
  borderRadius: 18,
  background: "#FBFAFF",
  boxShadow: "0 3px 12px rgba(108, 99, 255, 0.06)",
  overflow: "hidden",
};

const weekDayCardActiveStyle: CSSProperties = {
  ...weekDayCardStyle,
  boxShadow: "0 4px 16px rgba(108, 99, 255, 0.18)",
  background: "#F1EEFE",
};

const weekDayHeaderStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 14px",
  border: "none",
  background: "transparent",
  cursor: "pointer",
};

const weekDayLabelStyle: CSSProperties = { fontSize: 15, fontWeight: 800, color: "#2b2140" };

const todayDotStyle: CSSProperties = { color: "#6C63FF", fontWeight: 800, fontSize: 12 };

const weekDayCountStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#6C63FF" };

const weekDayCountOverdueStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#F0553D" };

const weekDayCountEmptyStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: "#D8D4F5" };

const weekDayTaskListStyle: CSSProperties = { padding: "0 14px 14px" };

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
