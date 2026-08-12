"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate, buildWeekDays, toDateKey } from "@/lib/date";
import { memberNameById } from "@/lib/labels";
import TaskList from "@/features/tasks/TaskList";

type ViewMode = "day" | "week";

type DayTaskListProps = {
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
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const PREVIEW_LIMIT = 2;

export default function DayTaskList({
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
}: DayTaskListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [expanded, setExpanded] = useState(false);

  const todayKey = toDateKey(new Date());
  const weekDays = buildWeekDays(selectedDate);

  const weekTasks = monthTasks.filter((task) =>
    weekDays.some((day) => toDateKey(day) === task.due_date)
  );

  const sourceTasks = viewMode === "day" ? tasks : weekTasks;
  const unfinishedTasks = sourceTasks.filter((task) => task.status !== "approved");
  const approvedCount = sourceTasks.filter((task) => task.status === "approved").length;
  const totalCount = sourceTasks.length;
  const previewTasks = unfinishedTasks.slice(0, PREVIEW_LIMIT);
  const remainingCount = unfinishedTasks.length - previewTasks.length;

  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [expanded]);

  function openPanel() {
    setExpanded(true);
  }

  function closePanel() {
    setExpanded(false);
  }

  return (
    <>
      <section style={collapsedSectionStyle}>
        <div style={headerRowStyle}>
          <h2 style={sectionTitleStyle}>
            {viewMode === "day" ? `${formatKoreanDate(selectedDate)} 할 일` : "이번 주 할 일"}
          </h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" onClick={onAddTask} style={addTaskButtonStyle}>
              + 추가
            </button>
            <div style={toggleGroupStyle}>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                style={viewMode === "day" ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                일간
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                style={viewMode === "week" ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                주간
              </button>
            </div>
          </div>
        </div>

        <button type="button" onClick={openPanel} style={summaryBarStyle}>
          <span style={summaryCountStyle}>
            {approvedCount}/{totalCount} 완료
          </span>
          <span style={summaryChevronStyle}>펼쳐보기 ▲</span>
        </button>

        {totalCount === 0 ? (
          <div style={emptyStateStyle}>등록된 할 일이 없습니다.</div>
        ) : previewTasks.length === 0 ? (
          <div style={allDoneStateStyle}>모두 완료했어요! 🎉</div>
        ) : (
          <div style={previewListStyle}>
            {previewTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                onClick={openPanel}
                style={previewCardStyle}
              >
                <span style={previewCheckStyle} />
                <span style={previewTitleStyle}>{task.title}</span>
                <span style={previewMemberStyle}>
                  {memberNameById(members, task.assigned_member_id)}
                </span>
              </button>
            ))}
            {remainingCount > 0 && (
              <button type="button" onClick={openPanel} style={moreButtonStyle}>
                더보기 ({remainingCount}개)
              </button>
            )}
          </div>
        )}
      </section>

      <div
        style={backdropStyle(expanded)}
        onClick={closePanel}
        aria-hidden={!expanded}
      />

      <div style={panelStyle(expanded)}>
        <div style={panelHandleStyle} />
        <div style={panelHeaderStyle}>
          <h2 style={sectionTitleStyle}>
            {viewMode === "day" ? `${formatKoreanDate(selectedDate)} 할 일` : "이번 주 할 일"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={onAddTask} style={addTaskButtonStyle}>
              + 추가
            </button>
          
            <div style={toggleGroupStyle}>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                style={viewMode === "day" ? toggleButtonActiveStyle : toggleButtonStyle}
              >
                일간
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
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
              <TaskList
                tasks={tasks}
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
              />
            )
          ) : (
            <div style={weekListStyle}>
              {weekDays.map((day) => {
                const dateKey = toDateKey(day);
                const dayTasks = monthTasks.filter((task) => task.due_date === dateKey);
                const dayApprovedCount = dayTasks.filter((task) => task.status === "approved").length;
                const dayTotalCount = dayTasks.length;
                const isPast = dateKey < todayKey;
                const isToday = dateKey === todayKey;
                const hasOverdueUnfinished = isPast && dayTasks.some((task) => task.status !== "approved");
                const isSelected = dateKey === selectedDate;

                return (
                  <div key={dateKey} style={isSelected ? weekDayCardActiveStyle : weekDayCardStyle}>
                    <button
                      type="button"
                      onClick={() => onSelectDate(dateKey)}
                      style={weekDayHeaderStyle}
                    >
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
                        <TaskList
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
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const collapsedSectionStyle: CSSProperties = { marginBottom: 90 };

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const sectionTitleStyle: CSSProperties = { margin: 0, fontSize: 20, letterSpacing: "-0.03em", color: "#3f1d24" };

const toggleGroupStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 999,
  padding: 4,
  boxShadow: "0 2px 8px rgba(219,39,119,0.08)",
};

const toggleButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#db2777",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const toggleButtonActiveStyle: CSSProperties = {
  ...toggleButtonStyle,
  background: "linear-gradient(135deg, #ec4899, #db2777)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(219,39,119,0.30)",
};

const summaryBarStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "none",
  background: "#fff0f2",
  borderRadius: 16,
  padding: "12px 16px",
  marginBottom: 10,
  cursor: "pointer",
};

const summaryCountStyle: CSSProperties = { fontWeight: 900, color: "#db2777", fontSize: 14 };

const summaryChevronStyle: CSSProperties = { fontWeight: 800, color: "#e8b9c2", fontSize: 12 };

const previewListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 8 };

const previewCardStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "none",
  background: "#fff8f7",
  borderRadius: 14,
  padding: "10px 14px",
  cursor: "pointer",
  textAlign: "left",
};

const previewCheckStyle: CSSProperties = {
  width: 18,
  height: 18,
  minWidth: 18,
  borderRadius: "50%",
  border: "2px solid #e8b9c2",
  background: "#fff",
};

const previewTitleStyle: CSSProperties = {
  flex: 1,
  fontWeight: 800,
  fontSize: 14,
  color: "#3f1d24",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const previewMemberStyle: CSSProperties = { fontSize: 12, color: "#9f6b75", whiteSpace: "nowrap" };

const moreButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#db2777",
  fontWeight: 800,
  fontSize: 13,
  padding: "6px 4px",
  cursor: "pointer",
  textAlign: "left",
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#fff5f6",
  color: "#9f6b75",
  textAlign: "center",
};

const allDoneStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#ecfdf5",
  color: "#047857",
  textAlign: "center",
  fontWeight: 800,
};

function backdropStyle(expanded: boolean): CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(63,29,36,0.45)",
    opacity: expanded ? 1 : 0,
    pointerEvents: expanded ? "auto" : "none",
    transition: "opacity 0.3s ease",
    zIndex: 40,
  };
}

function panelStyle(expanded: boolean): CSSProperties {
  return {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "88vh",
    maxHeight: "88dvh",
    background: "#fff",
    borderRadius: "24px 24px 0 0",
    boxShadow: "0 -10px 40px rgba(63,29,36,0.25)",
    transform: expanded ? "translateY(0)" : "translateY(100%)",
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
  background: "#f1d9dd",
  margin: "10px auto 4px",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px 18px 12px",
  borderBottom: "1px solid #f6e8e6",
};

const closeButtonStyle: CSSProperties = {
  border: "1px solid #f1d9dd",
  background: "#fff",
  color: "#9f6b75",
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

const weekListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const weekDayCardStyle: CSSProperties = {
  borderRadius: 18,
  background: "#fff8f7",
  boxShadow: "0 3px 12px rgba(219,39,119,0.06)",
  overflow: "hidden",
};

const weekDayCardActiveStyle: CSSProperties = {
  ...weekDayCardStyle,
  boxShadow: "0 4px 16px rgba(219,39,119,0.20)",
  background: "#fff0f2",
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

const weekDayLabelStyle: CSSProperties = { fontSize: 15, fontWeight: 800, color: "#3f1d24" };

const todayDotStyle: CSSProperties = { color: "#e11d48", fontWeight: 800, fontSize: 12 };

const weekDayCountStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#e11d48" };

const weekDayCountOverdueStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#dc2626" };

const weekDayCountEmptyStyle: CSSProperties = { fontSize: 14, fontWeight: 700, color: "#d8b4bc" };

const weekDayTaskListStyle: CSSProperties = { padding: "0 14px 14px" };

const addTaskButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#fff",
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

