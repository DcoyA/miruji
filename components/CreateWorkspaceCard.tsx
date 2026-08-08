import type { CSSProperties } from "react";

type CreateWorkspaceCardProps = {
  name: string;
  description: string;
  loading: boolean;
  compact?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: () => void;
};

export default function CreateWorkspaceCard({
  name,
  description,
  loading,
  compact,
  onNameChange,
  onDescriptionChange,
  onCreate,
}: CreateWorkspaceCardProps) {
  return (
    <section style={compact ? compactCreateBoxStyle : createBoxStyle}>
      {!compact && <h2 style={sectionTitleStyle}>첫 모임 만들기</h2>}

      <input
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="예) 우리집"
        style={inputStyle}
      />

      <textarea
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        placeholder="설명 (선택)"
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <button
        onClick={onCreate}
        disabled={loading}
        style={primaryButtonStyle(loading)}
      >
        {loading ? "생성 중..." : "모임 만들기"}
      </button>
    </section>
  );
}

const createBoxStyle: CSSProperties = {
  padding: 16,
  borderRadius: 20,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: 18,
};

const compactCreateBoxStyle: CSSProperties = {
  marginTop: 12,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 20,
  letterSpacing: "-0.03em",
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
