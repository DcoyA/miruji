import type { CSSProperties } from "react";
import type { Member, Workspace } from "@/types/app";

type MemberRole = "manager" | "member";

type SettingsTabProps = {
  workspaces: Workspace[];
  workspace: Workspace | null;
  members: Member[];
  currentMember: Member | null;
  isManager: boolean;
  workspaceName: string;
  workspaceDescription: string;
  loading: boolean;
  onWorkspaceNameChange: (value: string) => void;
  onWorkspaceDescriptionChange: (value: string) => void;
  onCreateWorkspace: () => void;
  newMemberName: string;
  newMemberRole: MemberRole;
  newMemberHasEmail: boolean;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (value: MemberRole) => void;
  onNewMemberHasEmailChange: (value: boolean) => void;
  onAddMember: () => void;
  inviteCodes: Record<string, string>;
  onCreateInvite: (member: Member) => void;
  joinInviteCode: string;
  onJoinInviteCodeChange: (value: string) => void;
  onAcceptInvite: () => void;
  onDeleteAccount: () => void;
};

export default function SettingsTab({
  workspaces,
  workspace,
  members,
  currentMember,
  isManager,
  workspaceName,
  workspaceDescription,
  loading,
  onWorkspaceNameChange,
  onWorkspaceDescriptionChange,
  onCreateWorkspace,
  newMemberName,
  newMemberRole,
  newMemberHasEmail,
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onNewMemberHasEmailChange,
  onAddMember,
  inviteCodes,
  onCreateInvite,
  joinInviteCode,
  onJoinInviteCodeChange,
  onAcceptInvite,
  onDeleteAccount,
}: SettingsTabProps) {
  const hasWorkspace = Boolean(workspace);

  return (
    <>
      <section style={createBoxStyle}>
        <h2 style={sectionTitleStyle}>설정</h2>
        <p style={subTextStyle}>워크스페이스, 참여자, 초대코드를 관리합니다.</p>
        {workspace ? (
          <>
            <div style={settingLineStyle}>현재 워크스페이스: <strong>{workspace.name}</strong></div>
            <div style={settingLineStyle}>내 역할: {currentMember ? roleLabel(currentMember.role) : "미연결"}</div>
            <div style={settingLineStyle}>워크스페이스 수: {workspaces.length}</div>
            <div style={settingLineStyle}>참여자 수: {members.length}</div>
          </>
        ) : (
          <div style={emptyStateStyle}>아직 참여 중인 워크스페이스가 없습니다.<br />초대코드를 입력하거나 새 워크스페이스를 만들어주세요.</div>
        )}
      </section>

      <section style={createBoxStyle}>
        <h2 style={sectionTitleStyle}>초대코드로 참여하기</h2>
        <p style={subTextStyle}>다른 사람이 만든 워크스페이스에 참여하려면 초대코드를 입력하세요.</p>
        <input value={joinInviteCode} onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())} placeholder="예) A1B2C3" style={inputStyle} />
        <button onClick={onAcceptInvite} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "참여 중..." : "초대코드로 참여하기"}</button>
      </section>

      {hasWorkspace && isManager && (
        <>
          <section style={createBoxStyle}>
            <h2 style={sectionTitleStyle}>참여자 추가</h2>
            <p style={subTextStyle}>이메일 유무에 따라 계정 연결 방식이 달라집니다.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={toggleLabelStyle}>이 참여자는 이메일이 있나요?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onNewMemberHasEmailChange(true)}
                  style={newMemberHasEmail ? emailToggleActiveStyle : emailToggleInactiveStyle}
                >
                  네, 있어요
                </button>
                <button
                  type="button"
                  onClick={() => onNewMemberHasEmailChange(false)}
                  style={!newMemberHasEmail ? emailToggleActiveStyle : emailToggleInactiveStyle}
                >
                  아니요, 없어요
                </button>
              </div>
              <p style={toggleHintStyle}>
                {newMemberHasEmail
                  ? "초대코드를 만들어서 전달하면, 상대가 코드를 입력해 본인 계정으로 연결할 수 있어요."
                  : "계정을 만들지 않고 보호자가 직접 관리합니다. 초대코드는 생성되지 않아요."}
              </p>
            </div>

            <input value={newMemberName} onChange={(event) => onNewMemberNameChange(event.target.value)} placeholder="예) 첫째, 아빠, 엄마, 토끼" style={inputStyle} />
            <select value={newMemberRole} onChange={(event) => onNewMemberRoleChange(event.target.value as MemberRole)} style={inputStyle}>
              <option value="member">참여자</option>
              <option value="manager">보호자/관리자</option>
            </select>
            <button onClick={onAddMember} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "추가 중..." : "참여자 추가"}</button>
          </section>

          <MemberList members={members} inviteCodes={inviteCodes} loading={loading} onCreateInvite={onCreateInvite} />
        </>
      )}

      {hasWorkspace && !isManager && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 참여 정보</h2>
          <p style={subTextStyle}>참여자는 참여자 추가와 초대코드 생성을 할 수 없습니다.</p>
          {currentMember && (
            <div style={settingLineStyle}>{currentMember.display_name} · {roleLabel(currentMember.role)}</div>
          )}
        </section>
      )}

      {(!hasWorkspace || isManager) && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>{hasWorkspace ? "새 워크스페이스 만들기" : "첫 워크스페이스 만들기"}</h2>
          <p style={subTextStyle}>가족, 팀, 클래스처럼 별도 공간이 필요하면 새 워크스페이스를 만들 수 있습니다.</p>
          <input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} placeholder="예) 우리집, 주말 프로젝트, 1학년 3반" style={inputStyle} />
          <textarea value={workspaceDescription} onChange={(event) => onWorkspaceDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={onCreateWorkspace} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "생성 중..." : "워크스페이스 만들기"}</button>
        </section>
      )}

      <section style={dangerBoxStyle}>
        <h2 style={{ ...sectionTitleStyle, color: "#b91c1c" }}>회원 탈퇴</h2>
        <p style={subTextStyle}>탈퇴하면 계정과 프로필 정보가 삭제되며 되돌릴 수 없습니다.</p>
        <button onClick={onDeleteAccount} style={dangerButtonStyle}>탈퇴하기</button>
      </section>
    </>
  );
}

function MemberList({ members, inviteCodes, loading, onCreateInvite }: { members: Member[]; inviteCodes: Record<string, string>; loading: boolean; onCreateInvite: (member: Member) => void; }) {
  return (
    <section style={createBoxStyle}>
      <h2 style={sectionTitleStyle}>참여자 목록</h2>
      {members.length === 0 ? (
        <div style={emptyStateStyle}>아직 참여자가 없습니다.</div>
      ) : (
        <div style={memberListStyle}>
          {members.map((member) => (
            <div key={member.id} style={memberCardStyle}>
              <div>
                <div style={memberNameStyle}>{member.display_name}</div>
                <div style={memberMetaStyle}>
                  {roleLabel(member.role)} ·{" "}
                  {member.is_virtual
                    ? member.requires_account
                      ? "초대 대기"
                      : "계정 없이 관리 중"
                    : "계정 연결됨"}
                </div>
                {inviteCodes[member.id] && <div style={inviteCodeBoxStyle}>초대코드: <strong>{inviteCodes[member.id]}</strong></div>}
              </div>
              {member.is_virtual && member.requires_account && (
                <button onClick={() => onCreateInvite(member)} disabled={loading} style={smallButtonStyle}>초대코드 생성</button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function roleLabel(role: string) { if (role === "owner") return "owner"; if (role === "manager") return "보호자"; return "참여자"; }

const createBoxStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 18 };
const dangerBoxStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 18 };
const sectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 20, letterSpacing: "-0.03em" };
const subTextStyle: CSSProperties = { color: "#64748b", lineHeight: 1.6, marginBottom: 20 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbeafe", marginBottom: 12, outline: "none", fontSize: 15 };
const settingLineStyle: CSSProperties = { padding: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginTop: 8, color: "#334155" };
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#fff", color: "#64748b", textAlign: "center", lineHeight: 1.6 };
const memberListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const memberCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#fff", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const memberNameStyle: CSSProperties = { fontSize: 16, fontWeight: 900 };
const memberMetaStyle: CSSProperties = { marginTop: 5, color: "#64748b", fontSize: 13 };
const inviteCodeBoxStyle: CSSProperties = { marginTop: 8, padding: "6px 8px", borderRadius: 10, background: "#eef2ff", color: "#4338ca", fontSize: 13, fontWeight: 800 };
const smallButtonStyle: CSSProperties = { border: "none", borderRadius: 12, background: "#4f46e5", color: "#fff", padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const toggleLabelStyle: CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 };
const toggleHintStyle: CSSProperties = { fontSize: 12, color: "#64748b", marginTop: 6, lineHeight: 1.5 };
const emailToggleActiveStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13 };
const emailToggleInactiveStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", fontWeight: 800, cursor: "pointer", fontSize: 13 };
const dangerButtonStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#b91c1c", color: "#fff", fontWeight: 800, cursor: "pointer" };
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "#4f46e5", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }; }
