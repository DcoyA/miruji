import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Workspace, WorkspaceInvite } from "@/types/app";
import { roleLabel } from "@/lib/labels";
import Avatar from "@/components/Avatar";
import PlanUpgradeModal from "@/components/PlanUpgradeModal";
import { enablePushNotifications } from "@/lib/push";

type MemberRole = "manager" | "member";
type ActionResult = { ok: boolean; text: string } | undefined;

type MembersTabProps = {
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
  onCreateWorkspace: () => Promise<ActionResult>;
  newMemberName: string;
  newMemberRole: MemberRole;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (value: MemberRole) => void;
  onAddMember: () => Promise<ActionResult>;
  inviteSuggestedName: string;
  onInviteSuggestedNameChange: (value: string) => void;
  onCreateInvite: () => Promise<{ ok: boolean; text: string } | null>;
  pendingInvites: WorkspaceInvite[];
  onCancelPendingInvite: (invite: WorkspaceInvite) => Promise<ActionResult>;
  onRemoveMember: (member: Member) => Promise<ActionResult>;
  onRestoreMember: (member: Member) => Promise<ActionResult>;
  joinInviteCode: string;
  onJoinInviteCodeChange: (value: string) => void;
  onAcceptInvite: () => Promise<ActionResult>;
  onDeleteAccount: () => Promise<ActionResult>;
  onTransferOwnership: (member: Member) => Promise<ActionResult>;
  onUpdateMemberRole: (member: Member, newRole: MemberRole) => Promise<ActionResult>;
  onDeleteWorkspace: (workspace: Workspace) => Promise<ActionResult>;
  focusWorkspaceManagementAt?: number;
};

function ResultMessage({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p style={{ marginTop: 8, fontSize: 13, color: result.ok ? "#047857" : "#b91c1c" }}>
      {result.text}
    </p>
  );
}

function memberStatusText(member: Member) {
  const parts = [roleLabel(member.role)];
  if (member.is_virtual) parts.push("가상 계정");
  if (member.status === "removed") parts.push("비활성");
  return parts.join(" · ");
}

export default function MembersTab({
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
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onAddMember,
  inviteSuggestedName,
  onInviteSuggestedNameChange,
  onCreateInvite,
  pendingInvites,
  onCancelPendingInvite,
  onRemoveMember,
  onRestoreMember,
  joinInviteCode,
  onJoinInviteCodeChange,
  onAcceptInvite,
  onDeleteAccount,
  onTransferOwnership,
  onUpdateMemberRole,
  onDeleteWorkspace,
  focusWorkspaceManagementAt,
}: MembersTabProps) {
  const hasWorkspace = Boolean(workspace);

  const [subTab, setSubTab] = useState<"members" | "workspace">("members");

  useEffect(() => {
    if (focusWorkspaceManagementAt) {
      setSubTab("workspace");
    }
  }, [focusWorkspaceManagementAt]);

  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [joinMessage, setJoinMessage] = useState<ActionResult | null>(null);
  const [createWorkspaceMessage, setCreateWorkspaceMessage] = useState<ActionResult | null>(null);
  const [addMemberMessage, setAddMemberMessage] = useState<ActionResult | null>(null);
  const [memberListMessage, setMemberListMessage] = useState<ActionResult | null>(null);
  const [cancelInviteMessage, setCancelInviteMessage] = useState<ActionResult | null>(null);
  const [deleteWorkspaceMessage, setDeleteWorkspaceMessage] = useState<ActionResult | null>(null);
  const [deleteAccountMessage, setDeleteAccountMessage] = useState<ActionResult | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalReason, setPlanModalReason] = useState("");

  const [notifStatus, setNotifStatus] = useState<string | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);

  function isPlanLimitError(text?: string) {
    if (!text) return false;
    return text.includes("무료 플랜") || text.includes("제한(최대") || text.includes("한도(") || text.includes("업그레이드");
  }

  function openPlanModal(reasonText: string) {
    setPlanModalReason(reasonText);
    setPlanModalOpen(true);
  }

  async function handleCreateInvite() {
    const result = await onCreateInvite();
    if (result) setInviteMessage(result);
    if (result && !result.ok && isPlanLimitError(result.text)) {
      openPlanModal(result.text);
    }
  }

  async function handleJoin() {
    const result = await onAcceptInvite();
    setJoinMessage(result ?? null);
  }

  async function handleCreateWorkspace() {
    const result = await onCreateWorkspace();
    setCreateWorkspaceMessage(result ?? null);
    if (result && !result.ok && isPlanLimitError(result.text)) {
      openPlanModal(result.text);
    }
  }

  async function handleAddMember() {
    const result = await onAddMember();
    setAddMemberMessage(result ?? null);
    if (result && !result.ok && isPlanLimitError(result.text)) {
      openPlanModal(result.text);
    }
  }

  async function handleCancelPendingInvite(invite: WorkspaceInvite) {
    const result = await onCancelPendingInvite(invite);
    setCancelInviteMessage(result ?? null);
  }

  async function handleDeleteWorkspace() {
    if (!workspace) return;
    const result = await onDeleteWorkspace(workspace);
    setDeleteWorkspaceMessage(result ?? null);
  }

  async function handleDeleteAccount() {
    const result = await onDeleteAccount();
    setDeleteAccountMessage(result ?? null);
  }

  async function handleEnableNotifications() {
    setNotifLoading(true);
    const result = await enablePushNotifications();
    setNotifStatus(result.message);
    setNotifLoading(false);
  }

  function handleCopyInviteCode(inviteId: string, code: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedInviteId(inviteId);
      setTimeout(() => {
        setCopiedInviteId((prev) => (prev === inviteId ? null : prev));
      }, 1800);
    });
  }

  function formatExpiryDate(iso: string) {
    const date = new Date(iso);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  return (
    <>
      <PlanUpgradeModal
        isOpen={planModalOpen}
        reasonText={planModalReason}
        onClose={() => setPlanModalOpen(false)}
      />

      <div style={subTabWrapStyle}>
        <button
          type="button"
          onClick={() => setSubTab("members")}
          style={subTab === "members" ? subTabActiveStyle : subTabButtonStyle}
        >
          참여자
        </button>
        <button
          type="button"
          onClick={() => setSubTab("workspace")}
          style={subTab === "workspace" ? subTabActiveStyle : subTabButtonStyle}
        >
          모임 관리
        </button>
      </div>

      {subTab === "members" && (
        <>
          <section style={createBoxStyle}>
            <h2 style={sectionTitleStyle}>참여자</h2>
            <p style={subTextStyle}>
              {hasWorkspace ? `${workspace!.name}에 있는 참여자 목록입니다.` : "아직 모임이 없습니다. 아래에서 모임을 만들거나 참가해보세요."}
            </p>

            {hasWorkspace && (
              isManager ? (
                <MemberList
                  members={members}
                  currentMember={currentMember}
                  loading={loading}
                  onRemoveMember={onRemoveMember}
                  onRestoreMember={onRestoreMember}
                  onTransferOwnership={onTransferOwnership}
                  onUpdateMemberRole={onUpdateMemberRole}
                  actionMessage={memberListMessage}
                  onActionResult={setMemberListMessage}
                />
              ) : members.length === 0 ? (
                <div style={emptyStateStyle}>아직 참여자가 없습니다.</div>
              ) : (
                <div style={memberListStyle}>
                  {members
                    .filter((member) => member.status !== "removed")
                    .map((member) => (
                      <div key={member.id} style={memberCardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar src={member.avatar_url} name={member.display_name} size={40} />
                          <div>
                            <div style={memberNameStyle}>{member.display_name}</div>
                            <div style={memberMetaStyle}>{memberStatusText(member)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )
            )}
          </section>

          <details style={accordionStyle}>
            <summary style={accordionSummaryStyle}>알림 받기</summary>
            <div style={accordionBodyStyle}>
              <p style={subTextStyle}>이 기기에서 할 일 등록, 제출, 승인/반려 알림을 받아보세요.</p>
              <button type="button" onClick={handleEnableNotifications} disabled={notifLoading} style={primaryButtonStyle(notifLoading)}>
                {notifLoading ? "등록 중..." : "알림 켜기"}
              </button>
              {notifStatus && <p style={subTextStyle}>{notifStatus}</p>}
            </div>
          </details>

          {hasWorkspace && isManager && (
            <details style={accordionStyle}>
              <summary style={accordionSummaryStyle}>초대 & 참여자 추가</summary>
              <div style={accordionBodyStyle}>
                <div style={{ marginBottom: 22 }}>
                  <h3 style={subSectionTitleStyle}>초대 코드 만들기</h3>
                  <p style={subTextStyle}>링크를 만들어 가족이나 팀원에게 공유하세요. 참가할 때 코드를 입력하면 모임에 들어올 수 있어요.</p>
                  <input
                    value={inviteSuggestedName}
                    onChange={(event) => onInviteSuggestedNameChange(event.target.value)}
                    placeholder="추천 이름 (선택, 예: 첫째)"
                    style={inputStyle}
                  />
                  <button onClick={handleCreateInvite} disabled={loading} style={primaryButtonStyle(loading)}>
                    {loading ? "만드는 중..." : "초대 코드 만들기"}
                  </button>
                  <ResultMessage result={inviteMessage} />

                  {pendingInvites.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      {pendingInvites.map((invite) => (
                        <div key={invite.id} style={inviteCodeCardStyle}>
                          <div>
                            <strong>{invite.invite_code}</strong> · {roleLabel(invite.role)}
                            {invite.suggested_name && ` · ${invite.suggested_name}`}
                          </div>
                          <div style={{ fontSize: 12, marginTop: 4 }}>만료일: {formatExpiryDate(invite.expires_at)}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => handleCopyInviteCode(invite.id, invite.invite_code)} style={copyLinkButtonStyle}>
                              {copiedInviteId === invite.id ? "복사됨!" : "코드 복사"}
                            </button>
                            <button type="button" onClick={() => handleCancelPendingInvite(invite)} disabled={loading} style={{ ...copyLinkButtonStyle, background: "#b91c1c" }}>
                              취소
                            </button>
                          </div>
                        </div>
                      ))}
                      <ResultMessage result={cancelInviteMessage} />
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={subSectionTitleStyle}>새 참여자 추가</h3>
                  <p style={subTextStyle}>스마트폰이 없어도 이용할 수 있는 참여자(아이, 반려동물 등)를 추가할 수 있어요.</p>
                  <input value={newMemberName} onChange={(event) => onNewMemberNameChange(event.target.value)} placeholder="예) 아이, 반려동물" style={inputStyle} />
                  <select value={newMemberRole} onChange={(event) => onNewMemberRoleChange(event.target.value as MemberRole)} style={inputStyle}>
                    <option value="member">참여자</option>
                    <option value="manager">부방장</option>
                  </select>
                  <button onClick={handleAddMember} disabled={loading} style={primaryButtonStyle(loading)}>
                    {loading ? "추가 중..." : "참여자 추가"}
                  </button>
                  <ResultMessage result={addMemberMessage} />
                </div>
              </div>
            </details>
          )}
        </>
      )}

      {subTab === "workspace" && (
        <>
          <details style={accordionStyle} open>
            <summary style={accordionSummaryStyle}>모임 참가 / 만들기</summary>
            <div style={accordionBodyStyle}>
              <div style={{ marginBottom: 22 }}>
                <h3 style={subSectionTitleStyle}>{hasWorkspace ? "다른 모임 참가하기" : "모임 참가하기"}</h3>
                <p style={subTextStyle}>초대받은 코드를 입력하면 해당 모임에 참가할 수 있어요.</p>
                <input value={joinInviteCode} onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())} placeholder="예) A1B2C3" style={inputStyle} />
                <button onClick={handleJoin} disabled={loading} style={primaryButtonStyle(loading)}>
                  {loading ? "참가 중..." : "초대코드로 참가하기"}
                </button>
                <ResultMessage result={joinMessage} />
              </div>

              <div>
                <h3 style={subSectionTitleStyle}>{hasWorkspace ? "새 모임 만들기" : "모임 만들기"}</h3>
                <p style={subTextStyle}>가족, 팀, 프로젝트 등 목적에 맞게 여러 모임을 만들고 관리할 수 있어요.</p>
                <input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} placeholder="예) 우리가족, 축구팀 등, 1~30자" style={inputStyle} />
                <textarea value={workspaceDescription} onChange={(event) => onWorkspaceDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <button onClick={handleCreateWorkspace} disabled={loading} style={primaryButtonStyle(loading)}>
                  {loading ? "저장 중..." : "모임 만들기"}
                </button>
                <ResultMessage result={createWorkspaceMessage} />
              </div>
            </div>
          </details>

          <details style={dangerAccordionStyle} open>
            <summary style={dangerAccordionSummaryStyle}>위험 구역</summary>
            <div style={accordionBodyStyle}>
              {hasWorkspace && currentMember?.role === "owner" && (
                <div style={{ marginBottom: 22 }}>
                  <h3 style={{ ...subSectionTitleStyle, color: "#b91c1c" }}>모임 삭제</h3>
                  <p style={subTextStyle}>
                    모임을 삭제하면 모든 참여자, 할 일, 보상 기록이 함께 삭제되며 복구할 수 없습니다. 신중하게 결정해주세요.
                  </p>
                  <button onClick={handleDeleteWorkspace} style={dangerButtonStyle}>
                    모임 삭제하기
                  </button>
                  <ResultMessage result={deleteWorkspaceMessage} />
                </div>
              )}

              <div>
                <h3 style={{ ...subSectionTitleStyle, color: "#b91c1c" }}>탈퇴하기</h3>
                <p style={subTextStyle}>탈퇴하면 참가 중인 모든 모임에서 정보가 삭제되고 복구할 수 없습니다.</p>
                <button onClick={handleDeleteAccount} style={dangerButtonStyle}>
                  탈퇴하기
                </button>
                <ResultMessage result={deleteAccountMessage} />
              </div>
            </div>
          </details>
        </>
      )}
    </>
  );
}

function MemberList({
  members,
  currentMember,
  loading,
  onRemoveMember,
  onRestoreMember,
  onTransferOwnership,
  onUpdateMemberRole,
  actionMessage,
  onActionResult,
}: {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  onRemoveMember: (member: Member) => Promise<ActionResult>;
  onRestoreMember: (member: Member) => Promise<ActionResult>;
  onTransferOwnership: (member: Member) => Promise<ActionResult>;
  onUpdateMemberRole: (member: Member, newRole: MemberRole) => Promise<ActionResult>;
  actionMessage: ActionResult | null;
  onActionResult: (result: ActionResult | null) => void;
}) {
  const isOwner = currentMember?.role === "owner";

  async function handle(action: () => Promise<ActionResult>) {
    const result = await action();
    onActionResult(result ?? null);
  }

  if (members.length === 0) {
    return <div style={emptyStateStyle}>아직 참여자가 없습니다.</div>;
  }

  return (
    <div>
      <div style={memberListStyle}>
        {members.map((member) => {
          const isRemoved = member.status === "removed";
          const canTransferTo = isOwner && !isRemoved && member.id !== currentMember?.id && Boolean(member.profile_id);

          return (
            <div key={member.id} style={isRemoved ? { ...memberCardStyle, opacity: 0.55 } : memberCardStyle}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar src={member.avatar_url} name={member.display_name} size={40} />
                  <div>
                    <div style={memberNameStyle}>{member.display_name}</div>
                    <div style={memberMetaStyle}>{memberStatusText(member)}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {canTransferTo && (
                  <button onClick={() => handle(() => onTransferOwnership(member))} disabled={loading} style={smallButtonStyle}>
                    방장 넘기기
                  </button>
                )}

                {!isRemoved && member.role !== "owner" && member.id !== currentMember?.id && (
                  member.role === "member" ? (
                    <button onClick={() => handle(() => onUpdateMemberRole(member, "manager"))} disabled={loading} style={smallButtonStyle}>
                      부방장으로 승급
                    </button>
                  ) : (
                    <button onClick={() => handle(() => onUpdateMemberRole(member, "member"))} disabled={loading} style={smallButtonStyle}>
                      참여자로 변경
                    </button>
                  )
                )}

                {isRemoved ? (
                  <button onClick={() => handle(() => onRestoreMember(member))} disabled={loading} style={smallButtonStyle}>
                    복구하기
                  </button>
                ) : (
                  member.role !== "owner" && (
                    <button onClick={() => handle(() => onRemoveMember(member))} disabled={loading} style={{ ...smallButtonStyle, background: "#b91c1c" }}>
                      내보내기
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ResultMessage result={actionMessage} />
    </div>
  );
}

const subTabWrapStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#fff",
  borderRadius: 999,
  padding: 4,
  boxShadow: "0 2px 8px rgba(108, 99, 255, 0.10)",
  marginBottom: 16,
};

const subTabButtonStyle: CSSProperties = {
  flex: 1,
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#6C63FF",
  padding: "9px 0",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const subTabActiveStyle: CSSProperties = {
  ...subTabButtonStyle,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(108, 99, 255, 0.30)",
};

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
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#fff", color: "#9f6b75", textAlign: "center", lineHeight: 1.6 };
const memberListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const memberCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#fff", boxShadow: "0 2px 10px rgba(219,39,119,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const memberNameStyle: CSSProperties = { fontSize: 16, fontWeight: 900, color: "#3f1d24" };
const memberMetaStyle: CSSProperties = { marginTop: 5, color: "#9f6b75", fontSize: 13 };
const inviteCodeCardStyle: CSSProperties = { padding: "10px 12px", borderRadius: 14, background: "#fce7f3", color: "#be185d", fontSize: 13, fontWeight: 700, marginBottom: 8 };
const copyLinkButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#db2777", color: "#fff", padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const smallButtonStyle: CSSProperties = { border: "none", borderRadius: 12, background: "#db2777", color: "#fff", padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const dangerButtonStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#b91c1c", color: "#fff", fontWeight: 800, cursor: "pointer" };
function primaryButtonStyle(loading: boolean): CSSProperties {
  return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "linear-gradient(135deg, #fb7185, #e11d48)", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 6px 14px rgba(225,29,72,0.30)" };
}
