"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Member } from "@/types/app";
import { weekdayLabel } from "@/lib/labels";

type RepeatType = "none" | "daily" | "weekly";

type AddTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  members: Member[];
  title: string;
  description: string;
  assignedMemberIds: string[];
  verificationType: string;
  dueTime: string;
  rewardPoints: number;
  repeatType: RepeatType;
  repeatWeekdays: number[];
  loading: boolean;
  onSelectedDateChange: (dateKey: string) => void;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onToggleAssignedMember: (memberId: string) => void;
  onVerificationTypeChange: (value: string) => void;
  onDueTimeChange: (value: string) => void;
  onRewardPointsChange: (value: number) => void;
  onRepeatTypeChange: (value: RepeatType) => void;
  onToggleRepeatWeekday: (day: number) => void;
  onCreate: () => void;
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const REWARD_PRESETS = [1, 3, 5, 10];

export default function AddTaskModal({
  isOpen,
  onClose,
  selectedDate,
  members,
  title,
  description,
  assignedMemberIds,
  verificationType,
  dueTime,
  rewardPoints,
  repeatType,
  repeatWeekdays,
  loading,
  onSelectedDateChange,
  onTitleChange,
  onDescriptionChange,
  onToggleAssignedMember,
  onVerificationTypeChange,
  onDueTimeChange,
  onRewardPointsChange,
  onRepeatTypeChange,
  onToggleRepeatWeekday,
  onCreate,
}: AddTaskModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const createDisabled =
    loading ||
    !title.trim() ||
    assignedMemberIds.length === 0 ||
    (repeatType === "weekly" && repeatWeekdays.length === 0);

  function handleCreateClick() {
    onCreate();
    onClose();
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerRowStyle}>
          <h2 style={titleStyle}>할 일 추가</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="닫기">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onSelectedDateChange(event.target.value)}
            style={inputStyle}
          />

          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="예) 피아노 100번 치기"
            style={inputStyle}
          />

          <div style={fieldLabelStyle}>담당자 (여러 명 선택 가능)</div>
          <div style={memberGridStyle}>
            {members.map((member) => {
              const active = assignedMemberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => onToggleAssignedMember(member.id)}
                  style={active ? memberChipActiveStyle : memberChipStyle}
                >
                  {member.display_name}
                </button>
              );
            })}
          </div>
          {assignedMemberIds.length > 1 && (
            <p style={hintStyle}>
              선택한 {assignedMemberIds.length}명에게 같은 할 일이 각각 따로 생성돼요.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            style={detailsToggleStyle}
          >
            {showDetails ? "상세설정 접기 ▲" : "상세설정하기 ▾"}
          </button>

          {showDetails && (
            <div style={detailsBoxStyle}>
              <textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="설명 (선택)"
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />

              <div style={fieldLabelStyle}>인증 방식</div>
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

              <div style={fieldLabelStyle}>마감 시간 (선택)</div>
              <input
                type="time"
                value={dueTime}
                onChange={(event) => onDueTimeChange(event.target.value)}
                style={inputStyle}
              />

              <div style={fieldLabelStyle}>완료 시 받을 스티커 개수</div>
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

              <div style={fieldLabelStyle}>반복 설정</div>
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
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateClick}
            disabled={createDisabled}
            style={primaryButtonStyle(createDisabled)}
          >
            {loading ? "생성 중..." : repeatType === "none" ? "할 일 만들기" : "반복 할 일 만들기"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(63,29,36,0.45)",
  zIndex: 50,
};

const panelStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: "50vh",
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  boxShadow: "0 -10px 40px rgba(63,29,36,0.25)",
  zIndex: 51,
  display: "flex",
  flexDirection: "column",
  maxWidth: 480,
  margin: "0 auto",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 18px 10px",
  borderBottom: "1px solid #f6e8e6",
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: "#3f1d24" };

const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 18,
  color: "#9f6b75",
  cursor: "pointer",
};

const bodyStyle: CSSProperties = {
  padding: "14px 18px 28px",
  overflowY: "auto",
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
  fontSize: 13,
  fontWeight: 800,
  color: "#5c3a41",
  marginBottom: 6,
};

const memberGridStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  marginBottom: 8,
};

const memberChipStyle: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid #fbcfe8",
  background: "#fff",
  color: "#db2777",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const memberChipActiveStyle: CSSProperties = {
  ...memberChipStyle,
  background: "linear-gradient(135deg, #ec4899, #db2777)",
  borderColor: "#db2777",
  color: "#fff",
};

const hintStyle: CSSProperties = { fontSize: 12, color: "#9f6b75", marginBottom: 10, lineHeight: 1.5 };

const detailsToggleStyle: CSSProperties = {
  width: "100%",
  border: "1px dashed #fbcfe8",
  background: "transparent",
  color: "#db2777",
  borderRadius: 12,
  padding: "10px 0",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 12,
};

const detailsBoxStyle: CSSProperties = {
  borderTop: "1px solid #f6e8e6",
  paddingTop: 12,
  marginBottom: 4,
};

const presetRowStyle: CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };

const presetButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 50,
  padding: "10px 0",
  borderRadius: 999,
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
};

const weekdayRowStyle: CSSProperties = { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" };

const weekdayButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 36,
  padding: "8px 0",
  borderRadius: 999,
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

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: disabled ? "#e8b9c2" : "linear-gradient(135deg, #ec4899, #db2777)",
    color: "#fff",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 6px 14px rgba(219,39,119,0.35)",
  };
}
