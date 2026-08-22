import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Workspace, WorkspaceInvite } from "@/types/app";
import { roleLabel } from "@/lib/labels";
import Avatar from "@/components/Avatar";
import PlanUpgradeModal from "@/components/PlanUpgradeModal";

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
  onLeaveWorkspace: () => Promise<ActionResult>;
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
  onLeaveWorkspace,
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
  const [leaveWorkspaceMessage, setLeaveWorkspaceMessage] = useState<ActionResult | null>(null);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalReason, setPlanModalReason] = useState("");

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
    if (!window.confirm(`"${workspace.name}" 모임을 정말 삭제하시겠어요? 이 작업은 되돌릴 수 없습니다.`)) return;
    const result = await onDeleteWorkspace(workspace);
    setDeleteWorkspaceMessage(result ?? null);
  }

  async function handleLeaveWorkspace() {
    const result = await onLeaveWorkspace();
    setLeaveWorkspaceMessage(result ?? null);
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

  async function handleShareInvite(invite: WorkspaceInvite) {
    const inviteUrl = `${window.location.origin}/join?code=${invite.invite_code}`;
    const shareText = `${workspace?.name ?? "모임"}에 초대할게요! 아래 링크를 눌러 참여해보세요.`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "미루지말자 초대장",
          text: shareText,
          url: inviteUrl,
        });
      } catch {
        // 사용자가 공유 시트를 취소한 경우는 에러로 처리하지 않음
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}\n${inviteUrl}`);
      setInviteMessage({ ok: true, text: "이 브라우저는 공유 시트를 지원하지 않아 링크를 복사했어요. 원하는 곳에 붙여넣어 보내주세요." });
    }
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
          <section style={sectionCardStyle}>
            <h2 style={sectionTitleStyle}>참여자</h2>
            <p style={subTextStyle}>
              {hasWorkspace ? `${workspace!.name}에 있는 참여자 목록입니다.` : "아직 모임이 없습니다. '모임 관리' 탭에서 모임을 만들거나 참가해보세요."}
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

          {hasWorkspace && isManager && (
            <section style={sectionCardStyle}>
              <h2 style={sectionTitleStyle}>초대 & 참여자 추가</h2>

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
                          <button type="button" onClick={() => handleShareInvite(invite)} style={shareButtonStyle}>
                            공유하기
                          </button>
                          <button type="button" onClick={() => handleCopyInviteCode(invite.id, invite.invite_code)} style={copyLinkButtonStyle}>
                            {copiedInviteId === invite.id ? "복사됨!" : "코드 복사"}
                          </button>
                          <button type="button" onClick={() => handleCancelPendingInvite(invite)} disabled={loading} style={outlineDangerButtonStyle}>
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
            </section>
          )}
        </>
      )}

      {subTab === "workspace" && (
        <>
          <section style={sectionCardStyle}>
            <h2 style={sectionTitleStyle}>{hasWorkspace ? "새 모임 만들기" : "모임 만들기"}</h2>
            <p style={subTextStyle}>가족, 팀, 프로젝트 등 목적에 맞게 여러 모임을 만들고 관리할 수 있어요.</p>
            <input value={workspaceName} onChange={(event) => onWorkspaceNameChange(event.target.value)} placeholder="예) 우리가족, 축구팀 등, 1~30자" style={inputStyle} />
            <textarea value={workspaceDescription} onChange={(event) => onWorkspaceDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
            <button onClick={handleCreateWorkspace} disabled={loading} style={primaryButtonStyle(loading)}>
              {loading ? "저장 중..." : "모임 만들기"}
            </button>
            <ResultMessage result={createWorkspaceMessage} />
          </section>

          <section style={sectionCardStyle}>
            <h2 style={sectionTitleStyle}>{hasWorkspace ? "다른 모임 참가하기" : "모임 참가하기"}</h2>
            <p style={subTextStyle}>초대받은 코드를 입력하면 해당 모임에 참가할 수 있어요.</p>
            <input value={joinInviteCode} onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())} placeholder="예) A1B2C3" style={inputStyle} />
            <button onClick={handleJoin} disabled={loading} style={primaryButtonStyle(loading)}>
              {loading ? "참가 중..." : "초대코드로 참가하기"}
            </button>
            <ResultMessage result={joinMessage} />
          </section>
          
          {hasWorkspace && currentMember && currentMember.role !== "owner" && (
            <section style={dangerCardStyle}>
              <h2 style={dangerTitleStyle}>
                <span style={{ fontSize: 15 }}>🚪</span>
                모임 나가기
              </h2>
              <p style={dangerTextStyle}>
                이 모임에서 나가면 참여자 목록에서 제외되며, 다시 참여하려면 새 초대코드가 필요합니다.
              </p>
              <button onClick={handleLeaveWorkspace} disabled={loading} style={outlineDangerFullButtonStyle}>
                모임 나가기
              </button>
              <ResultMessage result={leaveWorkspaceMessage} />
            </section>
          )}

          {hasWorkspace && currentMember?.role === "owner" && (
            <section style={dangerCardStyle}>
              <h2 style={dangerTitleStyle}>
                <span style={{ fontSize: 15 }}>⚠️</span>
                모임 삭제하기
              </h2>
              <p style={dangerTextStyle}>
                모임을 삭제하면 모든 참여자, 할 일, 보상 기록이 함께 삭제되며 복구할 수 없습니다. 신중하게 결정해주세요.
              </p>
              <button onClick={handleDeleteWorkspace} style={outlineDangerFullButtonStyle}>
                모임 삭제하기
              </button>
              <ResultMessage result={deleteWorkspaceMessage} />
            </section>
          )}
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
                    <button onClick={() => handle(() => onRemoveMember(member))} disabled={loading} style={outlineDangerButtonStyle}>
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
  gap: 8,
  background: "#fff",
  borderRadius: 999,
  padding: 6,
  boxShadow: "0 2px 10px rgba(108, 99, 255, 0.10)",
  marginTop: 6,
  marginBottom: 20,
};

const subTabButtonStyle: CSSProperties = {
  flex: 1,
  border: "none",
  borderRadius: 999,
  background: "transparent",
  color: "#6C63FF",
  padding: "13px 0",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
};

const subTabActiveStyle: CSSProperties = {
  ...subTabButtonStyle,
  background: "linear-gradient(135deg, #8B83EA, #6C63FF)",
  color: "#fff",
  boxShadow: "0 4px 10px rgba(108, 99, 255, 0.30)",
};

const sectionCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: "#fff",
  marginBottom: 16,
  boxShadow: "0 4px 16px rgba(108, 99, 255, 0.08)",
};

const dangerCardStyle: CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: "#FFF6F6",
  border: "1px solid #FFD9D9",
  marginBottom: 16,
};

const dangerTitleStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 900,
  color: "#E23D3D",
  letterSpacing: "-0.02em",
};

const dangerTextStyle: CSSProperties = {
  color: "#c97d7d",
  lineHeight: 1.6,
  marginBottom: 16,
  fontSize: 13,
};

const outlineDangerFullButtonStyle: CSSProperties = {
  width: "100%",
  padding: 13,
  borderRadius: 14,
  border: "1.5px solid #E23D3D",
  background: "#fff",
  color: "#E23D3D",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
};

const outlineDangerButtonStyle: CSSProperties = {
  border: "1px solid #F2B8B8",
  borderRadius: 12,
  background: "#fff",
  color: "#E23D3D",
  padding: "9px 10px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const sectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 19, letterSpacing: "-0.03em", color: "#2b2140" };
const subSectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: "#2b2140" };
const subTextStyle: CSSProperties = { color: "#8b83b0", lineHeight: 1.6, marginBottom: 16, fontSize: 13 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #E7E3FB", marginBottom: 12, outline: "none", fontSize: 15, background: "#FBFAFF" };
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#FBFAFF", color: "#8b83b0", textAlign: "center", lineHeight: 1.6 };
const memberListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const memberCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#FBFAFF", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const memberNameStyle: CSSProperties = { fontSize: 16, fontWeight: 900, color: "#2b2140" };
const memberMetaStyle: CSSProperties = { marginTop: 5, color: "#8b83b0", fontSize: 13 };
const inviteCodeCardStyle: CSSProperties = { padding: "10px 12px", borderRadius: 14, background: "#F1EEFE", color: "#6C63FF", fontSize: 13, fontWeight: 700, marginBottom: 8 };
const copyLinkButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "linear-gradient(135deg, #8B83EA, #6C63FF)", color: "#fff", padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const shareButtonStyle: CSSProperties = { border: "1.5px solid #6C63FF", borderRadius: 10, background: "#fff", color: "#6C63FF", padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const smallButtonStyle: CSSProperties = { border: "none", borderRadius: 12, background: "linear-gradient(135deg, #8B83EA, #6C63FF)", color: "#fff", padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: loading ? "#D8D4F5" : "linear-gradient(135deg, #8B83EA, #6C63FF)",
    color: "#fff",
    fontWeight: 800,
    cursor: loading ? "not-allowed" : "pointer",
    boxShadow: loading ? "none" : "0 6px 14px rgba(108, 99, 255, 0.30)",
  };
}
