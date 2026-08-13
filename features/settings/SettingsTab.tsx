import { useState } from "react";
import type { CSSProperties } from "react";
import type { Member, Workspace, WorkspaceInvite } from "@/types/app";
import { roleLabel } from "@/lib/labels";
import { supabase } from "@/lib/supabase/client";

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
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (value: MemberRole) => void;
  onAddMember: () => void;
  inviteRole: MemberRole;
  onInviteRoleChange: (value: MemberRole) => void;
  inviteSuggestedName: string;
  onInviteSuggestedNameChange: (value: string) => void;
  onCreateInvite: () => void;
  pendingInvites: WorkspaceInvite[];
  onCancelPendingInvite: (invite: WorkspaceInvite) => void;
  onRemoveMember: (member: Member) => void;
  onRestoreMember: (member: Member) => void;
  joinInviteCode: string;
  onJoinInviteCodeChange: (value: string) => void;
  onAcceptInvite: () => void;
  onDeleteAccount: () => void;
  onTransferOwnership: (member: Member) => void;
  onDeleteWorkspace: (workspace: Workspace) => void;
  myNickname: string;
  onMyNicknameChange: (value: string) => void;
  onSaveMyNickname: () => void;
  recoveryEmail: string;
  onRecoveryEmailChange: (value: string) => void;
  onSaveRecoveryEmail: () => void;
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  onChangePassword: () => void;
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
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onAddMember,
  inviteRole,
  onInviteRoleChange,
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
  onDeleteWorkspace,
  myNickname,
  onMyNicknameChange,
  onSaveMyNickname,
  recoveryEmail,
  onRecoveryEmailChange,
  onSaveRecoveryEmail,
  newPassword,
  onNewPasswordChange,
  onChangePassword,
}: SettingsTabProps) {
  const hasWorkspace = Boolean(workspace);
  const [appShareCopied, setAppShareCopied] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  function handleShareApp() {
    const link = typeof window !== "undefined" ? window.location.origin : "";
    const text = `미루지 – 가족/팀과 함께 할 일을 관리하고 스티커로 보상받는 앱\n${link}`;
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setAppShareCopied(true);
      setTimeout(() => setAppShareCopied(false), 1800);
    });
  }

  function buildInviteLink(code: string) {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join?code=${code}`;
  }

  function handleCopyInviteLink(inviteId: string, code: string) {
    const link = buildInviteLink(code);
    if (!link || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(link).then(() => {
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

  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function handleEnableNotifications() {
    try {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setNotifStatus("이 브라우저는 알림 기능을 지원하지 않습니다.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifStatus("알림 권한이 허용되지 않았습니다.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { data: userData } = await supabase.auth.getUser();
      const authUserId = userData?.user?.id;
      if (!authUserId) {
        setNotifStatus("로그인 정보를 확인할 수 없습니다.");
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", authUserId)
        .single();

      if (profileError || !profileRow) {
        setNotifStatus("프로필 정보를 확인할 수 없습니다.");
        return;
      }

      const profileId = profileRow.id;
      const tokenPayload = JSON.stringify(subscription.toJSON());

      const { error } = await supabase
        .from("device_tokens")
        .upsert(
          { profile_id: profileId, platform: "web-push", token: tokenPayload, last_seen_at: new Date().toISOString() },
          { onConflict: "profile_id,platform" }
        );

      if (error) {
        setNotifStatus(`알림 등록 실패: ${error.message}`);
        return;
      }

      setNotifStatus("알림이 활성화되었습니다.");
    } catch (err) {
      setNotifStatus("알림 활성화 중 오류가 발생했습니다.");
    }
  }

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

      <details style={accordionStyle}>
        <summary style={accordionSummaryStyle}>프로필</summary>
        <div style={accordionBodyStyle}>
          {currentMember && (
            <div style={{ marginBottom: 22 }}>
              <h3 style={subSectionTitleStyle}>닉네임</h3>
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
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <h3 style={subSectionTitleStyle}>복구용 이메일</h3>
            <p style={subTextStyle}>비밀번호를 잊었을 때 재설정 메일을 받을 이메일입니다. 선택 입력입니다.</p>
            <input
              value={recoveryEmail}
              onChange={(event) => onRecoveryEmailChange(event.target.value)}
              placeholder="예) me@example.com"
              type="email"
              autoComplete="email"
              style={inputStyle}
            />
            <button onClick={onSaveRecoveryEmail} disabled={loading} style={primaryButtonStyle(loading)}>
              {loading ? "저장 중..." : "이메일 저장"}
            </button>
          </div>

          <div>
            <h3 style={subSectionTitleStyle}>비밀번호 변경</h3>
            <p style={subTextStyle}>새 비밀번호는 6자 이상이어야 합니다.</p>
            <input
              value={newPassword}
              onChange={(event) => onNewPasswordChange(event.target.value)}
              placeholder="새 비밀번호"
              type="password"
              autoComplete="new-password"
              style={inputStyle}
            />
            <button onClick={onChangePassword} disabled={loading || !newPassword.trim()} style={primaryButtonStyle(loading)}>
              {loading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>
        </div>
      </details>

      <details style={accordionStyle}>
        <summary style={accordionSummaryStyle}>알림 & 공유</summary>
        <div style={accordionBodyStyle}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={subSectionTitleStyle}>알림 받기</h3>
            <p style={subTextStyle}>할 일 등록, 제출, 승인 소식을 알림으로 받아보세요.</p>
            <button type="button" onClick={handleEnableNotifications} style={primaryButtonStyle(false)}>
              알림 켜기
            </button>
            {notifStatus && <p style={subTextStyle}>{notifStatus}</p>}
          </div>

          <div>
            <h3 style={subSectionTitleStyle}>친구에게 공유하기</h3>
            <p style={subTextStyle}>미루지가 마음에 드셨다면 주변에 알려주세요.</p>
            <button type="button" onClick={handleShareApp} style={primaryButtonStyle(false)}>
              {appShareCopied ? "복사됨! 원하는 곳에 붙여넣어 보내보세요" : "친구에게 공유하기"}
            </button>
          </div>
        </div>
      </details>

      <details style={accordionStyle} open={!hasWorkspace}>
        <summary style={accordionSummaryStyle}>초대코드로 참여하기</summary>
        <div style={accordionBodyStyle}>
          <p style={subTextStyle}>다른 사람이 만든 모임에 참여하려면 초대코드를 입력하세요.</p>
          <input value={joinInviteCode} onChange={(event) => onJoinInviteCodeChange(event.target.value.toUpperCase())} placeholder="예) A1B2C3" style={inputStyle} />
          <button onClick={onAcceptInvite} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "참여 중..." : "초대코드로 참여하기"}</button>
        </div>
      </details>

      {hasWorkspace && isManager && (
        <details style={accordionStyle}>
          <summary style={accordionSummaryStyle}>참여자 관리</summary>
          <div style={accordionBodyStyle}>
            <div style={{ marginBottom: 22 }}>
              <h3 style={subSectionTitleStyle}>초대코드 발급</h3>
              <p style={subTextStyle}>코드를 만들어 전달하면, 상대가 코드로 직접 가입해 참여자가 됩니다.</p>
              <input
                value={inviteSuggestedName}
                onChange={(event) => onInviteSuggestedNameChange(event.target.value)}
                placeholder="별명 힌트 (선택, 예: 첫째)"
                style={inputStyle}
              />
              <select value={inviteRole} onChange={(event) => onInviteRoleChange(event.target.value as MemberRole)} style={inputStyle}>
                <option value="member">참여자</option>
                <option value="manager">부방장</option>
              </select>
              <button onClick={onCreateInvite} disabled={loading} style={primaryButtonStyle(loading)}>
                {loading ? "생성 중..." : "초대코드 발급"}
              </button>

              {pendingInvites.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} style={inviteCodeCardStyle}>
                      <div>
                        <strong>{invite.invite_code}</strong> · {roleLabel(invite.role)}
                        {invite.suggested_name && ` · ${invite.suggested_name}`}
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4 }}>{formatExpiryDate(invite.expires_at)}까지</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => handleCopyInviteLink(invite.id, invite.invite_code)} style={copyLinkButtonStyle}>
                          {copiedInviteId === invite.id ? "복사됨!" : "참여 링크 복사"}
                        </button>
                        <button type="button" onClick={() => onCancelPendingInvite(invite)} disabled={loading} style={{ ...copyLinkButtonStyle, background: "#b91c1c" }}>
                          취소
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={subSectionTitleStyle}>계정 없이 참여자 추가</h3>
              <p style={subTextStyle}>아기, 반려동물처럼 직접 로그인하지 않는 참여자는 방장/부방장이 대신 관리합니다.</p>
              <input value={newMemberName} onChange={(event) => onNewMemberNameChange(event.target.value)} placeholder="예) 첫째, 토끼" style={inputStyle} />
              <select value={newMemberRole} onChange={(event) => onNewMemberRoleChange(event.target.value as MemberRole)} style={inputStyle}>
                <option value="member">참여자</option>
                <option value="manager">부방장</option>
              </select>
              <button onClick={onAddMember} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "추가 중..." : "참여자 추가"}</button>
            </div>

            <MemberList
              members={members}
              currentMember={currentMember}
              loading={loading}
              onRemoveMember={onRemoveMember}
              onRestoreMember={onRestoreMember}
              onTransferOwnership={onTransferOwnership}
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
  loading,
  onRemoveMember,
  onRestoreMember,
  onTransferOwnership,
}: {
  members: Member[];
  currentMember: Member | null;
  loading: boolean;
  onRemoveMember: (member: Member) => void;
  onRestoreMember: (member: Member) => void;
  onTransferOwnership: (member: Member) => void;
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
                      ? "계정 없이 관리 중"
                      : "계정 연결됨"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {canTransferTo && (
                    <button onClick={() => onTransferOwnership(member)} disabled={loading} style={smallButtonStyle}>
                      방장 넘기기
                    </button>
                  )}

                  {isRemoved ? (
                    <button onClick={() => onRestoreMember(member)} disabled={loading} style={smallButtonStyle}>
                      복구하기
                    </button>
                  ) : (
                    member.role !== "owner" && (
                      <button onClick={() => onRemoveMember(member)} disabled={loading} style={{ ...smallButtonStyle, background: "#b91c1c" }}>
                        제외하기
                      </button>
                    )
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
const inviteCodeCardStyle: CSSProperties = { padding: "10px 12px", borderRadius: 14, background: "#fce7f3", color: "#be185d", fontSize: 13, fontWeight: 700, marginBottom: 8 };
const copyLinkButtonStyle: CSSProperties = { border: "none", borderRadius: 10, background: "#db2777", color: "#fff", padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer" };
const smallButtonStyle: CSSProperties = { border: "none", borderRadius: 12, background: "#db2777", color: "#fff", padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" };
const dangerButtonStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "none", background: "#b91c1c", color: "#fff", fontWeight: 800, cursor: "pointer" };
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "linear-gradient(135deg, #fb7185, #e11d48)", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 6px 14px rgba(225,29,72,0.30)" }; }
