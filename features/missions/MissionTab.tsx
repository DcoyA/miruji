import type { CSSProperties } from "react";
import type { Member, Task, TaskTemplate } from "@/types/app";
import { formatKoreanDate } from "@/lib/date";
import { repeatSummary, weekdayLabel } from "@/lib/labels";
import TaskList from "@/features/tasks/TaskList";

type RepeatType = "none" | "daily" | "weekly";

type MissionTabProps = {
  selectedDate: string;
  members: Member[];
  tasks: Task[];
  templates: TaskTemplate[];
  currentMember: Member | null;
  isManager: boolean;
  title: string;
  description: string;
  assignedMemberId: string;
  verificationType: string;
  rewardPoints: number;
  repeatType: RepeatType;
  repeatWeekdays: number[];
  loading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssignedMemberIdChange: (value: string) => void;
  onVerificationTypeChange: (value: string) => void;
  onRewardPointsChange: (value: number) => void;
  onRepeatTypeChange: (value: RepeatType) => void;
  onToggleRepeatWeekday: (day: number) => void;
  onCreate: () => void;
  onSubmitTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
  onToggleTemplateActive: (template: TaskTemplate) => void;
  onDeleteTemplate: (template: TaskTemplate) => void;
  onRolloverNow: () => void;
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const REWARD_PRESETS = [1, 3, 5, 10];

export default function MissionTab({
  selectedDate,
  members,
  tasks,
  templates,
  currentMember,
  isManager,
  title,
  description,
  assignedMemberId,
  verificationType,
  rewardPoints,
  repeatType,
  repeatWeekdays,
  loading,
  onTitleChange,
  onDescriptionChange,
  onAssignedMemberIdChange,
  onVerificationTypeChange,
  onRewardPointsChange,
  onRepeatTypeChange,
  onToggleRepeatWeekday,
  onCreate,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
  onToggleTemplateActive,
  onDeleteTemplate,
  onRolloverNow,
}: MissionTabProps) {
  const visibleTasks = isManager
    ? tasks
    : tasks.filter((task) => task.assigned_member_id === currentMember?.id);

  const createDisabled =
    loading || (repeatType === "weekly" && repeatWeekdays.length === 0);

  return (
    <>
      {isManager ? (
        <section style={createBoxStyle}>
          <div style={createHeaderRowStyle}>
            <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 할 일 추가</h2>
            <button onClick={onRolloverNow} disabled={loading} style={rolloverButtonStyle}>
              지난 할 일 정리하기
            </button>
          </div>

          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="예) 피아노 100번 치기"
            style={inputStyle}
          />

          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="설명 (선택)"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <select
            value={assignedMemberId}
            onChange={(event) => onAssignedMemberIdChange(event.target.value)}
            style={inputStyle}
          >
            <option value="">할 일을 받을 참여자 선택</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name}
              </option>
            ))}
          </select>

          <select
            value={verificationType}
            onChange={(event) => onVerificationTypeChange(event.target.value)}
            style={inputStyle}
          >
            <option value="none">인증 없음</option>
            <option value="text">텍스트 인증</option>
            <option value="photo">사진 인증</option>
            <option value="video">영상 인증</option>
            <option value="audio">음성 인증</option>
          </select>

          <label style={fieldLabelStyle}>완료하면 받을 스티커 개수</label>
          <div style={presetRowStyle}>
            {REWARD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onRewardPointsChange(preset)}
                style={rewardPoints === preset ? presetButtonActiveStyle : presetButtonStyle}
              >
                {preset}개
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            value={rewardPoints}
            onChange={(event) => onRewardPointsChange(Number(event.target.value))}
            placeholder="직접 입력"
            style={inputStyle}
          />
          <p style={fieldHintStyle}>참여자가 이 할 일을 완료하고 승인받으면 스티커를 받아요.</p>

          <div style={repeatLabelStyle}>반복 설정</div>
          <select
            value={repeatType}
            onChange={(event) => onRepeatTypeChange(event.target.value as RepeatType)}
            style={inputStyle}
          >
            <option value="none">반복 없음 (오늘만)</option>
            <option value="daily">매일 반복</option>
            <option value="weekly">요일 선택 반복</option>
          </select>

          {repeatType === "weekly" && (
            <div style={weekdayRowStyle}>
              {WEEKDAYS.map((day) => {
                const active = repeatWeekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onToggleRepeatWeekday(day)}
                    style={active ? weekdayButtonActiveStyle : weekdayButtonStyle}
                  >
                    {weekdayLabel(day)}
                  </button>
                );
              })}
            </div>
          )}

          <button onClick={onCreate} disabled={createDisabled} style={primaryButtonStyle(createDisabled)}>
            {loading ? "생성 중..." : repeatType === "none" ? "할 일 만들기" : "반복 할 일 만들기"}
          </button>
        </section>
      ) : (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 할 일</h2>
          <p style={subTextStyle}>참여자는 본인에게 배정된 할 일만 확인합니다.</p>
        </section>
      )}

      {isManager && templates.length > 0 && (
        <section style={templateSectionStyle}>
          <h2 style={sectionTitleStyle}>반복 할 일 관리</h2>
          <div style={templateListStyle}>
            {templates.map((template) => (
              <div key={template.id} style={templateCardStyle}>
                <div>
                  <div style={templateTitleStyle}>{template.title}</div>
                  <div style={taskSubTextStyleLocal}>
                    {repeatSummary(template.repeat_type, template.repeat_weekdays)} · 스티커{" "}
                    {template.reward_points}개
                  </div>
                </div>
                <div style={templateActionRowStyle}>
                  <button
                    onClick={() => onToggleTemplateActive(template)}
                    disabled={loading}
                    style={template.is_active ? pauseButtonStyle : resumeButtonStyle}
                  >
                    {template.is_active ? "일시중지" : "재개"}
                  </button>
                  <button
                    onClick={() => onDeleteTemplate(template)}
                    disabled={loading}
                    style={deleteButtonStyle}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={dayTaskSectionStyle}>
        <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 할 일 목록</h2>

        {visibleTasks.length === 0 ? (
          <div style={emptyStateStyle}>이 날짜에 표시할 할 일이 없습니다.</div>
        ) : (
          <TaskList
            tasks={visibleTasks}
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
    </>
  );
}

const createBoxStyle: CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: "#fffbfc",
  border: "1px solid #fde2e7",
  marginBottom: 18,
  boxShadow: "0 4px 16px rgba(219,39,119,0.06)",
};

const createHeaderRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
  flexWrap: "wrap",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  letterSpacing: "-0.03em",
};

const subTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 20,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #fbcfe8",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
  marginBottom: 6,
};

const fieldHintStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: -6,
  marginBottom: 14,
  lineHeight: 1.5,
};

const presetRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 10,
  flexWrap: "wrap",
};

const presetButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 50,
  padding: "10px 0",
  borderRadius: 12,
  border: "1px solid #fbcfe8",
  background: "#fff",
  color: "#db2777",
  fontWeight: 800,
  cursor: "pointer",
};

const presetButtonActiveStyle: CSSProperties = {
  ...presetButtonStyle,
  background: "linear-gradient(135deg, #ec4899, #db2777)",
  borderColor: "#db2777",
  color: "#fff",
  boxShadow: "0 6px 14px rgba(219,39,119,0.35)",
};

const repeatLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#475569",
  margin: "4px 0 8px",
};

const weekdayRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  marginBottom: 12,
  flexWrap: "wrap",
};

const weekdayButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 36,
  padding: "8px 0",
  borderRadius: 10,
  border: "1px solid #fbcfe8",
  background: "#fff",
  color: "#be185d",
  fontWeight: 800,
  cursor: "pointer",
};

const weekdayButtonActiveStyle: CSSProperties = {
  ...weekdayButtonStyle,
  background: "linear-gradient(135deg, #ec4899, #db2777)",
  borderColor: "#db2777",
  color: "#fff",
};

const dayTaskSectionStyle: CSSProperties = {
  marginBottom: 80,
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};

const rolloverButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #fbcfe8",
  background: "#fff",
  color: "#db2777",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const templateSectionStyle: CSSProperties = {
  marginBottom: 24,
};

const templateListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const templateCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const templateTitleStyle: CSSProperties = {
  fontWeight: 900,
  fontSize: 15,
};

const taskSubTextStyleLocal: CSSProperties = {
  marginTop: 5,
  color: "#64748b",
  fontSize: 13,
};

const templateActionRowStyle: CSSProperties = {
  display: "flex",
  gap: 6,
};

const pauseButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#f59e0b",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const resumeButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#15803d",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#b91c1c",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: disabled ? "#94a3b8" : "linear-gradient(135deg, #ec4899, #db2777)",
    color: "#fff",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 6px 14px rgba(219,39,119,0.35)",
  };
}
