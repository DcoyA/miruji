"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Task } from "@/types/app";

type EditTaskPatch = {
  title: string;
  description: string;
  verificationType: string;
  dueTime: string;
  rewardPoints: number;
  dueDate: string;
};

type EditTaskModalProps = {
  isOpen: boolean;
  task: Task | null;
  loading: boolean;
  onClose: () => void;
  onSave: (taskId: string, patch: EditTaskPatch) => void;
};

const REWARD_PRESETS = [1, 3, 5, 10];

export default function EditTaskModal({ isOpen, task, loading, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [verificationType, setVerificationType] = useState("none");
  const [dueTime, setDueTime] = useState("");
  const [rewardPoints, setRewardPoints] = useState(1);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setVerificationType(task.verification_type);
      setDueTime(task.due_time ? task.due_time.slice(0, 5) : "");
      setRewardPoints(task.reward_points);
      setDueDate(task.due_date);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const saveDisabled = loading || !title.trim();

  function handleSaveClick() {
    if (!task) return;
    onSave(task.id, { title, description, verificationType, dueTime, rewardPoints, dueDate });
    onClose();
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerRowStyle}>
          <h2 style={titleStyle}>할 일 수정</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle} aria-label="닫기">
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} style={inputStyle} />

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="할 일 제목"
            style={inputStyle}
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="설명 (선택)"
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <div style={fieldLabelStyle}>인증 방식</div>
          <select value={verificationType} onChange={(event) => setVerificationType(event.target.value)} style={inputStyle}>
            <option value="none">인증 없음</option>
            <option value="text">텍스트 인증</option>
            <option value="photo">사진 인증</option>
            <option value="video">영상 인증</option>
            <option value="audio">음성 인증</option>
          </select>

          <div style={fieldLabelStyle}>마감 시간 (선택)</div>
          <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} style={inputStyle} />

          <div style={fieldLabelStyle}>완료 시 받을 스티커 개수</div>
          <div style={presetRowStyle}>
            {REWARD_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRewardPoints(preset)}
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
            onChange={(event) => setRewardPoints(Number(event.target.value))}
            placeholder="직접 입력"
            style={inputStyle}
          />

          <button type="button" onClick={handleSaveClick} disabled={saveDisabled} style={primaryButtonStyle(saveDisabled)}>
            {loading ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(43, 33, 64, 0.45)",
  zIndex: 50,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "40vh",
  maxHeight: "85dvh",
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  boxShadow: "0 -10px 40px rgba(43,33,64,0.25)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  paddingTop: "env(safe-area-inset-top)",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 18px 10px",
  borderBottom: "1px solid #F1EEFE",
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 18, fontWeight: 900, color: "#2b2140" };

const closeButtonStyle: CSSProperties = { border: "none", background: "transparent", fontSize: 18, color: "#8b83b0", cursor: "pointer" };

const bodyStyle: CSSProperties = { padding: "14px 18px 28px", overflowY: "auto" };

const inputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #D8D4F5",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
};

const fieldLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 800, color: "#5b5470", marginBottom: 6 };

const presetRowStyle: CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };

const presetButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 50,
  padding: "10px 0",
  borderRadius: 999,
  border: "1px solid #D8D4F5",
  background: "#fff",
  color: "#6C63FF",
  fontWeight: 800,
  cursor: "pointer",
};

const presetButtonActiveStyle: CSSProperties = {
  ...presetButtonStyle,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  borderColor: "#6C63FF",
  color: "#fff",
};

function primaryButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: disabled ? "#D8D4F5" : "linear-gradient(135deg, #8B83EA, #6C63FF)",
    color: "#fff",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 6px 14px rgba(108, 99, 255, 0.35)",
  };
}
