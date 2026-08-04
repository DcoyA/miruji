import type { CSSProperties } from "react";
import type { Member, Task } from "@/types/app";
import { formatKoreanDate } from "@/lib/date";
import TaskList from "@/features/tasks/TaskList";

type MissionTabProps = {
  selectedDate: string;
  members: Member[];
  tasks: Task[];
  currentMember: Member | null;
  isManager: boolean;
  title: string;
  description: string;
  assignedMemberId: string;
  verificationType: string;
  rewardPoints: number;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAssignedMemberIdChange: (value: string) => void;
  onVerificationTypeChange: (value: string) => void;
  onRewardPointsChange: (value: number) => void;
  onCreate: () => void;
  onSubmitTask: (task: Task) => void;
  onApproveTask: (task: Task) => void;
  onRejectTask: (task: Task) => void;
};

export default function MissionTab({
  selectedDate,
  members,
  tasks,
  currentMember,
  isManager,
  title,
  description,
  assignedMemberId,
  verificationType,
  rewardPoints,
  loading,
  onTitleChange,
  onDescriptionChange,
  onAssignedMemberIdChange,
  onVerificationTypeChange,
  onRewardPointsChange,
  onCreate,
  onSubmitTask,
  onApproveTask,
  onRejectTask,
}: MissionTabProps) {
  const visibleTasks = isManager
    ? tasks
    : tasks.filter((task) => task.assigned_member_id === currentMember?.id);

  return (
    <>
      {isManager ? (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션 추가</h2>

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
            <option value="">미션 받을 참여자 선택</option>
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

          <input
            type="number"
            min={0}
            value={rewardPoints}
            onChange={(event) => onRewardPointsChange(Number(event.target.value))}
            placeholder="스티커 개수"
            style={inputStyle}
          />

          <button onClick={onCreate} disabled={loading} style={primaryButtonStyle(loading)}>
            {loading ? "생성 중..." : "미션 만들기"}
          </button>
        </section>
      ) : (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 미션</h2>
          <p style={subTextStyle}>참여자는 본인에게 배정된 미션만 확인합니다.</p>
        </section>
      )}

      <section style={dayTaskSectionStyle}>
        <h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션 목록</h2>

        {visibleTasks.length === 0 ? (
          <div style={emptyStateStyle}>이 날짜에 표시할 미션이 없습니다.</div>
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
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: 18,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
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
  border: "1px solid #dbeafe",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
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

function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: loading ? "#94a3b8" : "#4f46e5",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
  };
}
