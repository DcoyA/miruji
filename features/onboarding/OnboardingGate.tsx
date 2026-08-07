"use client";

import type { CSSProperties } from "react";

export type OnboardingStep = "choice" | "create" | "join";

type OnboardingGateProps = {
  step: OnboardingStep;
  loading: boolean;
  message: string;
  onChooseCreate: () => void;
  onChooseJoin: () => void;
  onBack: () => void;
  workspaceName: string;
  workspaceDescription: string;
  onWorkspaceNameChange: (value: string) => void;
  onWorkspaceDescriptionChange: (value: string) => void;
  onCreateWorkspace: () => void;
  joinInviteCode: string;
  onJoinInviteCodeChange: (value: string) => void;
  onAcceptInvite: () => void;
};

export default function OnboardingGate({
  step,
  loading,
  message,
  onChooseCreate,
  onChooseJoin,
  onBack,
  workspaceName,
  workspaceDescription,
  onWorkspaceNameChange,
  onWorkspaceDescriptionChange,
  onCreateWorkspace,
  joinInviteCode,
  onJoinInviteCodeChange,
  onAcceptInvite,
}: OnboardingGateProps) {
  if (step === "create") {
    return (
      <section style={onboardingBoxStyle}>
        <button onClick={onBack} style={onboardingBackButtonStyle}>
          ← 뒤로
        </button>
        <h2 style={onboardingTitleStyle}>워크스페이스 만들기</h2>
        <p style={onboardingTextStyle}>
          가족, 학급, 팀 등 함께 미션을 관리할 공간의 이름을 정해주세요. 만든 사람은
          자동으로 owner(소유자) 권한을 갖게 됩니다.
        </p>
        <input
          value={workspaceName}
          onChange={(event) => onWorkspaceNameChange(event.target.value)}
          placeholder="예) 우리집, 1학년 3반, OO네 가족"
          style={onboardingInputStyle}
        />
        <textarea
          value={workspaceDescription}
          onChange={(event) => onWorkspaceDescriptionChange(event.target.value)}
          placeholder="설명 (선택)"
          rows={3}
          style={{ ...onboardingInputStyle, resize: "vertical" }}
        />
        <button
          onClick={onCreateWorkspace}
          disabled={loading}
          style={onboardingPrimaryButtonStyle(loading)}
        >
          {loading ? "만드는 중..." : "워크스페이스 만들기"}
        </button>
        {message && <div style={onboardingMessageStyle}>{message}</div>}
      </section>
    );
  }

  if (step === "join") {
    return (
      <section style={onboardingBoxStyle}>
        <button onClick={onBack} style={onboardingBackButtonStyle}>
          ← 뒤로
        </button>
        <h2 style={onboardingTitleStyle}>초대 코드로 참여하기</h2>
        <p style={onboardingTextStyle}>매니저에게 받은 초대 코드를 입력해주세요.</p>
        <input
          value={joinInviteCode}
          onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())}
          placeholder="예) A1B2C3"
          style={onboardingInputStyle}
        />
        <button
          onClick={onAcceptInvite}
          disabled={loading}
          style={onboardingPrimaryButtonStyle(loading)}
        >
          {loading ? "확인 중..." : "참여하기"}
        </button>
        {message && <div style={onboardingMessageStyle}>{message}</div>}
      </section>
    );
  }

  return (
    <section style={onboardingBoxStyle}>
      <h1 style={onboardingWelcomeTitleStyle}>환영합니다!</h1>
      <p style={onboardingTextStyle}>
        가족, 학급, 팀 등 누구나 함께 미션과 보상을 관리할 수 있는 워크스페이스가
        필요해요. 아래에서 하나를 선택해주세요.
      </p>
      <button onClick={onChooseCreate} style={onboardingChoiceButtonStyle}>
        <span style={onboardingChoiceTitleStyle}>워크스페이스 만들기</span>
        <span style={onboardingChoiceDescStyle}>새로운 공간을 처음 만드는 경우</span>
      </button>
      <button onClick={onChooseJoin} style={onboardingChoiceButtonStyle}>
        <span style={onboardingChoiceTitleStyle}>초대 코드로 참여하기</span>
        <span style={onboardingChoiceDescStyle}>이미 만들어진 공간에 참여하는 경우</span>
      </button>
      {message && <div style={onboardingMessageStyle}>{message}</div>}
    </section>
  );
}

const onboardingBoxStyle: CSSProperties = {
  padding: 20,
  borderRadius: 22,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};
const onboardingWelcomeTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};
const onboardingTitleStyle: CSSProperties = {
  margin: "12px 0 10px",
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};
const onboardingTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 18,
};
const onboardingBackButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#4f46e5",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
  marginBottom: 8,
};
const onboardingInputStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "1px solid #dbeafe",
  marginBottom: 12,
  outline: "none",
  fontSize: 15,
  background: "#fff",
};
const onboardingMessageStyle: CSSProperties = {
  marginTop: 14,
  padding: 12,
  borderRadius: 14,
  background: "#eef2ff",
  color: "#4338ca",
  fontSize: 13,
  lineHeight: 1.5,
};
const onboardingChoiceButtonStyle: CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: 16,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "#fff",
  marginBottom: 12,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const onboardingChoiceTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  color: "#1e293b",
};
const onboardingChoiceDescStyle: CSSProperties = { fontSize: 13, color: "#64748b" };

function onboardingPrimaryButtonStyle(loading: boolean): CSSProperties {
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
