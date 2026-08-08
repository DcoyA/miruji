import type { CSSProperties } from "react";
import type { Member, Workspace } from "@/types/app";
import { roleLabel } from "@/lib/labels";

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
  onEnableAccount: (member: Member) => void;
  onRemoveMember: (member: Member) => void;
  onRestoreMember: (member: Member) => void;
  joinInviteCode: string;
  onJoinInviteCodeChange: (value: string) => void;
  onAcceptInvite: () => void;
  onDeleteAccount: () => void;
  onTransferOwnership: (member: Member) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  onCancelInvite: (member: Member) => void;
  inviteExpiresAt: Record<string, string>;
  myNickname: string;
  onMyNicknameChange: (value: string) => void;
  onSaveMyNickname: () => void;
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
  onEnableAccount,
  onRemoveMember,
  onRestoreMember,
  joinInviteCode,
  onJoinInviteCodeChange,
  onAcceptInvite,
  onDeleteAccount,
  onTransferOwnership,
  onDeleteWorkspace,
  onCancelInvite,
  inviteExpiresAt,
  myNickname,
  onMyNicknameChange,
  onSaveMyNickname,
}: SettingsTabProps) {
  const hasWorkspace = Boolean(workspace);

  return (
    <>
      <section style={createBoxStyle}>
        <h2 style={sectionTitleStyle}>설정</h2>
        <p style={subTextStyle}>모임, 참여자, 초대코드를 관리합니다.</p>
        {workspace ? (
          <>
            <div style={settingLineStyle}>현재 모임: <strong>{workspace.name}</strong></div>
            <div style={settingLineStyle}>내 역할: {currentMember ? roleLabel(currentMember.role) : "미연결"}</div>
            <div style={settingLineStyle}>모임 수: {workspaces.length}</div>
            <div style={settingLineStyle}>참여자 수: {members.length}</div>
          </>
        ) : (
          <div style={emptyStateStyle}>아직 참여 중인 모임이 없습니다.<br />초대코드를 입력하거나 새 모임을 만들어주세요.</div>
        )}
      </section>

      {currentMember && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 닉네임</h2>
          <p style={subTextStyle}>다른 참여자에게 보여질 내 이름을 바꿀 수 있습니다.</p>
          <input
            value={myNickname}
            onChange={(event) => onMyNicknameChange(event.target.value)}
            placeholder="예) 아빠, 엄마, 첫째"
            style={inputStyle}
          />
          <button
            onClick={onSaveMyNickname}
            disabled={loading || !myNickname.trim() || myNickname.trim() === currentMember.display_name}
            style={primaryButtonStyle(loading)}
          >
            {loading ? "저장 중..." : "닉네임 저장"}
          </button>
        </section>
      )}

      <details style={accordionStyle} open={!hasWorkspace}>
        <summary style={accordionSummaryStyle}>초대코드로 참여하기</summary>
        <div style={accordionBodyStyle}>
          <p style={subTextStyle}>다른 사람이 만든 모임에 참여하려면 초대코드를 입력하세요.</p>
          <input value={joinInviteCode} onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())} placeholder="예) A1B2C3" style={inputStyle} />
          <button onClick={onAcceptInvite} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "참여 중..." : "초대코드로 참여하기"}</button>
        </div>
      </details>

      {hasWorkspace && isManager && (
        <details style={accordionStyle} open>
          <summary style={accordionSummaryStyle}>참여자 관리</summary>
          <div style={accordionBodyStyle}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={subSectionTitleStyle}>참여자 추가</h3>
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
                    : "계정을 만들지 않고 부방장이 직접 관리합니다. 초대코드는 생성되지 않아요."}
                </p>
              </div>

              <input value={newMemberName} onChange={(event) => onNewMemberNameChange(event.target.value)} placeholder="예) 첫째, 아빠, 엄마, 토끼" style={inputStyle} />
              <select value={newMemberRole} onChange={(event) => onNewMemberRoleChange(event.target.value as MemberRole)} style={inputStyle}>
                <option value="member">참여자</option>
                <option value="manager">부방장</option>
              </select>
              <button onClick={onAddMember} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "추가 중..." : "참여자 추가"}</button>
            </div>

            <MemberList
              members={members}
              currentMember={currentMember}
              inviteCodes={inviteCodes}
              loading={loading}
              onCreateInvite={onCreateInvite}
              onEnableAccount={onEnableAccount}
              onRemoveMember={onRemoveMember}
              onRestoreMember={onRestoreMember}
              onTransferOwnership={onTransferOwnership}
              onCancelInvite={onCancelInvite}
              inviteExpiresAt={inviteExpiresAt}
            />
          </div>
        </details>
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

      <details style={accordionStyle}>
        <summary style={accordionSummaryStyle}>{hasWorkspace ? "새 모임 만들기" : "첫 모임 만들기"}</summary>
        <div style={accordionBodyStyle}>
          <p style={subTextStyle}>가족, 팀, 클래스처럼 별도 공간이 필요하면 새 모임을 만들 수 있습니다.</p>
          <input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} placeholder="예) 우리집, 주말 프로젝트, 1학년 3반" style={inputStyle} />
          <textarea value={workspaceDescription} onChange={(event) => onWorkspaceDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          <button onClick={onCreateWorkspace} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "생성 중..." : "모임 만들기"}</button>
        </div>
      </details>

      <details style={dangerAccordionStyle}>
        <summary style={dangerAccordionSummaryStyle}>위험 구역</summary>
        <div style={accordionBodyStyle}>
          {hasWorkspace && currentMember?.role === "owner" && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ ...subSectionTitleStyle, color: "#b91c1c" }}>모임 삭제</h3>
              <p style={subTextStyle}>
                모임을 삭제하면 모든 할 일, 참여자, 보상 기록이 함께 삭제되며 되돌릴 수
                없습니다. 방장은 다른 참여자의 동의 없이 단독으로 삭제할 수 있습니다.
              </p>
              <button onClick={() => onDeleteWorkspace(workspace!)} style={dangerButtonStyle}>
                모임 삭제하기
              </button>
            </div>
          )}

          <div>
            <h3 style={{ ...subSectionTitleStyle, color: "#b91c1c" }}>회원 탈퇴</h3>
            <p style={subTextStyle}>탈퇴하면 계정과 프로필 정보가 삭제되며 되돌릴 수 없습니다.</p>
            <button onClick={onDeleteAccount} style={dangerButtonStyle}>탈퇴하기</button>
          </div>
        </div>
      </details>
    </>
  );
}

function MemberList({
  members,
  currentMember,
  inviteCodes,
  loading,
  onCreateInvite,
  onEnableAccount,
  onRemoveMember,
  onRestoreMember,
  onTransferOwnership,
  onCancelInvite,
  inviteExpiresAt,
}: {
  members: Member[];
  currentMember: Member | null;
  inviteCodes: Record<string, string>;
  loading: boolean;
  onCreateInvite: (member: Member) => void;
  onEnableAccount: (member: Member) => void;
  onRemoveMember: (member: Member) => void;
  onRestoreMember: (member: Member) => void;
  onTransferOwnership: (member: Member) => void;
  onCancelInvite: (member: Member) => void;
  inviteExpiresAt: Record<string, string>;
}) {
  const isOwner = currentMember?.role === "owner";

  return (
    <div>
      <h3 style={subSectionTitleStyle}>참여자 목록</h3>
      {members.length === 0 ? (
        <div style={emptyStateStyle}>아직 참여자가 없습니다.</div>
      ) : (
        <div style={memberListStyle}>
          {members.map((member) => {
            const isRemoved = member.status === "removed";
            const canTransferTo =
              isOwner &&
              !isRemoved &&
              member.id !== currentMember?.id &&
              Boolean(member.profile_id);

            return (
              <div
                key={member.id}
                style={isRemoved ? { ...memberCardStyle, opacity: 0.55 } : memberCardStyle}
              >
                <div>
                  <div style={memberNameStyle}>{member.display_name}</div>
                  <div style={memberMetaStyle}>
                    {roleLabel(member.role)} ·{" "}
                    {isRemoved
                      ? "제외됨"
                      : member.is_virtual
                      ? member.requires_account
                        ? "초대 대기"
                        : "계정 없이 관리 중"
                      : "계정 연결됨"}
                  </div>
                  {inviteCodes[member.id] && (
                    <div style={inviteCodeBoxStyle}>
                      <div>
                        초대코드: <strong>{inviteCodes[member.id]}</strong>
                      </div>
                      {inviteExpiresAt[member.id] && (
                        <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600 }}>
                          만료일: {formatExpiryDate(inviteExpiresAt[member.id])}까지
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const link = buildInviteLink(inviteCodes[member.id]);
                            if (link && typeof navigator !== "undefined") {
                              navigator.clipboard.writeText(link);
                            }
                          }}
                          style={copyLinkButtonStyle}
                        >
                          참여 링크 복사하기
                        </button>
                        <button
                          type="button"
                          onClick={() => onCancelInvite(member)}
                          disabled={loading}
                          style={{ ...copyLinkButtonStyle, background: "#b91c1c" }}
                        >
                          초대코드 취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {canTransferTo && (
                    <button
                      onClick={() => onTransferOwnership(member)}
                      disabled={loading}
                      style={smallButtonStyle}
                    >
                      방장 넘기기
                    </button>
                  )}

                  {isRemoved ? (
                    <button
                      onClick={() => onRestoreMember(member)}
                      disabled={loading}
                      style={smallButtonStyle}
                    >
                      복구하기
                    </button>
                  ) : (
                    <>
                      {member.is_virtual && !member.requires_account && (
                        <button
                          onClick={() => onEnableAccount(member)}
                          disabled={loading}
                          style={smallButtonStyle}
                        >
                          실제 계정으로 전환하기
                        </button>
                      )}

                      {member.is_virtual && member.requires_account && (
                        <button
                          onClick={() => onCreateInvite(member)}
                          disabled={loading}
                          style={smallButtonStyle}
                        >
                          초대코드 생성
                        </button>
                      )}

                      {member.role !== "owner" && (
                        <button
                          onClick={() => onRemoveMember(member)}
                          disabled={loading}
                          style={{ ...smallButtonStyle, background: "#b91c1c" }}
                        >
                          제외하기
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildInviteLink(code: string) {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/join?code=${code}`;
}
function formatExpiryDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

const createBoxStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#fff8f7", marginBottom: 18, boxShadow: "0 4px 16px rgba(219,39,119,0.06)" };
const accordionStyle: CSSProperties = { padding: 0, borderRadius: 20, background: "#fff8f7", marginBottom: 18, overflow: "hidden", boxShadow: "0 4px 16px rgba(219,39,119,0.06)" };
const dangerAccordionStyle: CSSProperties = { padding: 0, borderRadius: 20, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 18, overflow: "hidden" };
const accordionSummaryStyle: CSSProperties = { padding: 16, fontSize: 17, fontWeight: 800, cursor: "pointer", letterSpacing: "-0.02em", listStyle: "revert", color: "#3f1d24" };
const dangerAccordionSummaryStyle: CSSProperties = { ...accordionSummaryStyle, color: "#b91c1c" };
const accordionBodyStyle: CSSProperties = { padding: "0 16px 16px" };
const subSectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "#3f1d24" };
const sectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 20, letterSpacing: "-0.03em", color: "#3f1d24" };
const subTextStyle: CSSProperties = { color: "#9f6b75", lineHeight: 1.6, marginBottom: 20 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #fbcfe8", marginBottom: 12, outline: "none", fontSize: 15 };
const settingLineStyle: CSSProperties = { padding: 12, background: "#fff", borderRadius: 14, marginTop: 8, color: "#5c3a41", boxShadow: "0 2px 8px rgba(219,39,119,0.05)" };
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#fff", color: "#9f6b75", textAlign: "center", lineHeight: 1.6 };
const memberListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const memberCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#fff", boxShadow: "0 2px 10px rgba(219,39,119,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const memberNameStyle: CSSProperties = { fontSize: 16, fontWeight: 900, color: "#3f1d24" };
const memberMetaStyle: CSSProperties = { marginTop: 5, color: "#9f6b75", fontSize: 13 };
const inviteCodeBoxStyle: CSSProperties = { marginTop: 8, padding: "6px 8px", borderRadius: 10, background: "#fce7f3", color: "#be185d", fontSize: 13, fontWeight: 800 };
const copyLinkButtonStyle: CSSProperties = { marginTop: 8, border: "none", borderRadius: 10, background: "#db2777", color: "#fff", padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const smallButtonStyle: CSSProperties = { border: "none", borderRadius: 12, background: "#db2777", color: "#fff", padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const toggleLabelStyle: CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, color: "#5c3a41", marginBottom: 6 };
const toggleHintStyle: CSSProperties = { fontSize: 12, color: "#9f6b75", marginTop: 6, lineHeight: 1.5 };
const emailToggleActiveStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #ec4899, #db2777)", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 13, boxShadow: "0 6px 14px rgba(219,39,119,0.35)" };
const emailToggleInactiveStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "1px solid #fbcfe8", background: "#fff", color: "#db2777", fontWeight: 800, cursor: "pointer", fontSize: 13 };
const dangerButtonStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#b91c1c", color: "#fff", fontWeight: 800, cursor: "pointer" };
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "linear-gradient(135deg, #fb7185, #e11d48)", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 6px 14px rgba(225,29,72,0.30)" }; }
