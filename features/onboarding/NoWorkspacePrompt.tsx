import type { CSSProperties } from "react";

type NoWorkspacePromptProps = {
  onGoSettings: () => void;
};

export default function NoWorkspacePrompt({ onGoSettings }: NoWorkspacePromptProps) {
  return (
    <section style={emptyWorkspaceBoxStyle}>
      <h2 style={emptyWorkspaceTitleStyle}>모임이 없어요</h2>
      <p style={emptyWorkspaceTextStyle}>
        설정 탭에서 모임을 만들거나 초대 코드로 참여해주세요.
      </p>
      <button onClick={onGoSettings} style={emptyWorkspaceButtonStyle}>
        설정으로 이동
      </button>
    </section>
  );
}

const emptyWorkspaceBoxStyle: CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginTop: 18,
};
const emptyWorkspaceTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  fontWeight: 900,
};
const emptyWorkspaceTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 14,
};
const emptyWorkspaceButtonStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};
