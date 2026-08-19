"use client";

import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import SortableTaskList from "@/features/tasks/SortableTaskList";
import { addDays, formatKoreanDateWithWeekday, toDateKey } from "@/lib/date";

type DayViewProps = {
  selectedDate: string;
  tasks: Task[];
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  loading: boolean;
  onSelectDate: (dateKey: string) => void;
  onAddTask: () => void;
  onSubmitTask: (task: Task) => void;
  onSubmitWithEvidence?: (task: Task, file: File) => void;
  onSubmitWithText?: (task: Task, text: string) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
  onCancelTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorderTasks: (dateKey: string, orderedTaskIds: string[]) => void;
  onEditTask: (task: Task) => void;
};

function shiftDateKey(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return toDateKey(addDays(date, amount));
}

export default function DayView({
  selectedDate,
  tasks,
  members,
  currentMember,
  isManager,
  loading,
  onSelectDate,
  onAddTask,
  onSubmitTask,
  onSubmitWithEvidence,
  onSubmitWithText,
  onApproveTask,
  onRejectTask,
  onCancelTask,
  onDeleteTask,
  onReorderTasks,
  onEditTask,
}: DayViewProps) {
  const sorted = [...tasks].sort((a, b) => {
    const orderA = a.order_index ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order_index ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
  const approvedCount = sorted.filter((task) => task.status === "approved").length;
  const todayKey = toDateKey(new Date());
  const isToday = selectedDate === todayKey;

  function goToPrevDay() {
    onSelectDate(shiftDateKey(selectedDate, -1));
  }

  function goToNextDay() {
    onSelectDate(shiftDateKey(selectedDate, 1));
  }

  function goToToday() {
    onSelectDate(todayKey);
  }

  return (
    <div style={wrapStyle}>
      <div style={dayNavRowStyle}>
        <button type="button" onClick={goToPrevDay} style={dayNavButtonStyle} aria-label="이전 날">
          ‹
        </button>
        <div style={dayTitleWrapStyle}>
          <span style={dayTitleStyle}>{formatKoreanDateWithWeekday(selectedDate)}</span>
          {isToday && <span style={todayBadgeStyle}>오늘</span>}
        </div>
        <button type="button" onClick={goToNextDay} style={dayNavButtonStyle} aria-label="다음 날">
          ›
        </button>
        {!isToday && (
          <button type="button" onClick={goToToday} style={todayButtonStyle}>
            오늘
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div style={emptyWrapStyle}>
          <p style={emptyTextStyle}>
            등록된 할 일이 없습니다.
            <br />
            할 일을 생성하세요.
          </p>
          <button type="button" onClick={onAddTask} style={emptyAddButtonStyle} aria-label="할 일 추가">
            +
          </button>
        </div>
      ) : (
        <>
          <div style={headerRowStyle}>
            <span style={summaryTextStyle}>
              {approvedCount}/{sorted.length} 완료
            </span>
            <button type="button" onClick={onAddTask} style={addButtonStyle}>
              + 추가
            </button>
          </div>
          <SortableTaskList
            tasks={sorted}
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
        </>
      )}
    </div>
  );
}

const wrapStyle: CSSProperties = { paddingBottom: 12 };

const dayNavRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 14,
};

const dayNavButtonStyle: CSSProperties = {
  width: 40,
  height: 40,
  flexShrink: 0,
  border: "none",
  borderRadius: 14,
  background: "#FBFAFF",
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.10)",
  fontSize: 20,
  fontWeight: 800,
  color: "#6C63FF",
  cursor: "pointer",
};

const dayTitleWrapStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const dayTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 17,
  color: "#2b2140",
};

const todayBadgeStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: "#6C63FF",
  background: "#F1EEFE",
  borderRadius: 999,
  padding: "2px 8px",
};

const todayButtonStyle: CSSProperties = {
  height: 40,
  flexShrink: 0,
  border: "none",
  borderRadius: 14,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 12,
  padding: "0 12px",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(108, 99, 255, 0.35)",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const summaryTextStyle: CSSProperties = { fontSize: 13, fontWeight: 800, color: "#6C63FF" };

const addButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 999,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const emptyWrapStyle: CSSProperties = {
  minHeight: 200,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: "24px 12px",
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#8b83b0",
  fontSize: 14,
  lineHeight: 1.6,
  fontWeight: 700,
};

const emptyAddButtonStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  fontSize: 22,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 6px 16px rgba(108, 99, 255, 0.35)",
};
