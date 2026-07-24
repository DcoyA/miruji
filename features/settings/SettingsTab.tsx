import type { CSSProperties } from "react";
import type { Member, Workspace } from "@/types/app";

type SettingsTabProps = {
  workspaces: Workspace[];
  workspace: Workspace;
  members: Member[];
  workspaceName: string;
  workspaceDescription: string;
  loading: boolean;
  onWorkspaceNameChange: (value: string) => void;
  onWorkspaceDescriptionChange: (value: string) => void;
  onCreateWorkspace: () => void;
};

export default function SettingsTab({
  workspaces,
  workspace,
  members,
  workspaceName,
  workspaceDescription,
  loading,
  onWorkspaceNameChange,
  onWorkspaceDescriptionChange,
  onCreateWorkspace,
}: SettingsTabProps) {
  return (
    <>
      <section style={createBoxStyle}>
        <h2 style={sectionTitleStyle}>설정</h2>

        <p style={subTextStyle}>
          프로필 수정, 초대코드, 워크스페이스 설정은 다음 단계에서 붙입니다.
        </p>

        <div style={settingLineStyle}>
          현재 워크스페이스: <strong>{workspace.name}</strong>
        </div>

        <div style={settingLineStyle}>워크스페이스 수: {workspaces.length}</div>

        <div style={settingLineStyle}>참여자 수: {members.length}</div>
      </section>

      <section style={createBoxStyle}>
        <h2 style={sectionTitleStyle}>새 워크스페이스 만들기</h2>

        <p style={subTextStyle}>
          가족, 팀, 클래스처럼 별도 공간이 필요하면 새 워크스페이스를 만들 수 있습니다.
        </p>

        <input
          value={workspaceName}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
          placeholder="예) 우리집, 주말 프로젝트, 1학년 3반"
          style={inputStyle}
        />

        <textarea
          value={workspaceDescription}
          onChange={(event) => onWorkspaceDescriptionChange(event.target.value)}
          placeholder="설명 (선택)"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <button
          onClick={onCreateWorkspace}
          disabled={loading}
          style={primaryButtonStyle(loading)}
        >
          {loading ? "생성 중..." : "워크스페이스 만들기"}
        </button>
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

const settingLineStyle: CSSProperties = {
  padding: 12,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  marginTop: 8,
  color: "#334155",
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
