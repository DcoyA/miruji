import type { CSSProperties } from "react";
import type { Member, Reward, RewardTransaction } from "@/types/app";
import { memberNameById } from "@/lib/labels";

type RewardTabProps = {
  members: Member[];
  rewards: Reward[];
  transactions: RewardTransaction[];
  currentMember: Member | null;
  isManager: boolean;
  title: string;
  description: string;
  targetMemberId: string;
  costPoints: number;
  loading: boolean;
  balanceByMemberId: (memberId: string) => number;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTargetMemberIdChange: (value: string) => void;
  onCostPointsChange: (value: number) => void;
  onCreate: () => void;
  onRequestRedeem: (reward: Reward) => void;
  onConfirmRedeem: (reward: Reward) => void;
  onRejectRedeem: (reward: Reward) => void;
  onDeleteReward: (reward: Reward) => void;
};

const COST_PRESETS = [5, 10, 20, 50];

export default function RewardTab({
  members,
  rewards,
  transactions,
  currentMember,
  isManager,
  title,
  description,
  targetMemberId,
  costPoints,
  loading,
  balanceByMemberId,
  onTitleChange,
  onDescriptionChange,
  onTargetMemberIdChange,
  onCostPointsChange,
  onCreate,
  onRequestRedeem,
  onConfirmRedeem,
  onRejectRedeem,
  onDeleteReward,
}: RewardTabProps) {
  const visibleRewards = isManager
    ? rewards
    : rewards.filter((reward) => reward.target_member_id === currentMember?.id);

  const currentBalance = currentMember ? balanceByMemberId(currentMember.id) : 0;

  const myTransactions = currentMember
    ? transactions
        .filter((item) => item.member_id === currentMember.id)
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    : [];

  const nextGoal = !isManager && currentMember
    ? rewards
        .filter((reward) => reward.target_member_id === currentMember.id && reward.status === "approved")
        .sort((a, b) => a.cost_points - b.cost_points)
        .find((reward) => reward.cost_points > currentBalance)
    : null;

  return (
    <>
      {!isManager && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 보상함</h2>
          <div style={balanceBoxStyle}>{currentBalance}개</div>
          <p style={subTextStyle}>
            참여자는 본인에게 배정된 보상만 확인하고 교환을 신청할 수 있습니다. 신청 후 부방장이 승인하면 스티커가 차감됩니다.
          </p>

          {nextGoal && (
            <div style={goalBoxStyle}>
              <div style={goalTitleStyle}>다음 목표: {nextGoal.title}</div>
              <div style={progressTrackStyle}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${Math.min(100, Math.round((currentBalance / nextGoal.cost_points) * 100))}%`,
                  }}
                />
              </div>
              <div style={goalSubTextStyle}>
                {Math.max(0, nextGoal.cost_points - currentBalance)}개 더 모으면 교환할 수 있어요
              </div>
            </div>
          )}

          <div style={historyBoxStyle}>
            <div style={historyTitleStyle}>최근 내역</div>
            {myTransactions.length === 0 ? (
              <div style={historyEmptyStyle}>아직 쌓인 내역이 없어요.</div>
            ) : (
              myTransactions.map((item) => (
                <div key={item.id} style={historyRowStyle}>
                  <div>
                    <div style={historyMemoStyle}>
                      {item.memo || (item.transaction_type === "earn" ? "적립" : "사용")}
                    </div>
                    <div style={historyDateStyle}>{formatShortDate(item.created_at)}</div>
                  </div>
                  <span style={item.amount >= 0 ? historyAmountPlusStyle : historyAmountMinusStyle}>
                    {item.amount >= 0 ? `+${item.amount}` : item.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {isManager && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>보상 만들기</h2>
          <p style={subTextStyle}>모은 스티커로 교환할 수 있는 보상을 등록하세요.</p>

          <input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="예) 게임 30분, 떡볶이 먹기" style={inputStyle} />
          <textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />

          <select value={targetMemberId} onChange={(event) => onTargetMemberIdChange(event.target.value)} style={inputStyle}>
            <option value="">보상 대상 참여자 선택</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.display_name} · 스티커 {balanceByMemberId(member.id)}개</option>
            ))}
          </select>

          <label style={fieldLabelStyle}>필요한 스티커 개수</label>
          <div style={presetRowStyle}>
            {COST_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onCostPointsChange(preset)}
                style={costPoints === preset ? presetButtonActiveStyle : presetButtonStyle}
              >
                {preset}개
              </button>
            ))}
          </div>
          <input type="number" min={0} value={costPoints} onChange={(event) => onCostPointsChange(Number(event.target.value))} placeholder="직접 입력" style={inputStyle} />
          <p style={fieldHintStyle}>참여자가 이만큼 스티커를 모으면 이 보상으로 교환을 신청할 수 있어요.</p>

          <button onClick={onCreate} disabled={loading} style={primaryButtonStyle(loading)}>
            {loading ? "생성 중..." : "보상 만들기"}
          </button>
        </section>
      )}

      <section style={rewardListSectionStyle}>
        <h2 style={sectionTitleStyle}>보상 목록</h2>
        {visibleRewards.length === 0 ? (
          <div style={emptyStateStyle}>표시할 보상이 없습니다.</div>
        ) : (
          <div style={rewardListStyle}>
            {visibleRewards.map((reward) => {
              const balance = reward.target_member_id ? balanceByMemberId(reward.target_member_id) : 0;
              const canRequest = reward.status === "approved" && balance >= reward.cost_points;
              const isOwnReward = !isManager && reward.target_member_id === currentMember?.id;

              return (
                <div key={reward.id} style={rewardCardStyle}>
                  <div>
                    <div style={rewardTitleStyle}>{reward.title}</div>
                    {reward.description && <div style={rewardSubTextStyle}>{reward.description}</div>}
                    <div style={rewardSubTextStyle}>대상: {memberNameById(members, reward.target_member_id)} · 필요 {reward.cost_points}개 · 현재 {balance}개</div>
                  </div>

                  {reward.status === "redeemed" && <span style={redeemedBadgeStyle}>교환 완료</span>}

                  {reward.status === "requested" && isManager && (
                    <div style={reviewButtonRowStyle}>
                      <span style={requestedBadgeStyle}>교환 신청됨</span>
                      <button onClick={() => onConfirmRedeem(reward)} disabled={loading} style={rewardButtonStyle}>승인</button>
                      <button onClick={() => onRejectRedeem(reward)} disabled={loading} style={rejectButtonStyle}>거절</button>
                    </div>
                  )}

                  {reward.status === "requested" && !isManager && (
                    <span style={requestedBadgeStyle}>부방장 승인 대기중</span>
                  )}

                  {reward.status === "approved" && isOwnReward && (
                    <button onClick={() => onRequestRedeem(reward)} disabled={loading || !canRequest} style={canRequest ? rewardButtonStyle : disabledRewardButtonStyle}>
                      교환 신청하기
                    </button>
                  )}

                  {reward.status === "approved" && isManager && (
                    <div style={reviewButtonRowStyle}>
                      <span style={rewardSubTextStyle}>대상 참여자의 신청 대기중</span>
                      <button onClick={() => onDeleteReward(reward)} disabled={loading} style={rejectButtonStyle}>
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function formatShortDate(iso: string) {
  const date = new Date(iso);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

const createBoxStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 18 };
const rewardListSectionStyle: CSSProperties = { marginBottom: 80 };
const sectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 20, letterSpacing: "-0.03em" };
const subTextStyle: CSSProperties = { color: "#64748b", lineHeight: 1.6, marginBottom: 20 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbeafe", marginBottom: 12, outline: "none", fontSize: 15 };
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#f8fafc", color: "#64748b", textAlign: "center" };
const rewardListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const rewardCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 };
const rewardTitleStyle: CSSProperties = { fontWeight: 900, fontSize: 16 };
const rewardSubTextStyle: CSSProperties = { marginTop: 5, color: "#64748b", fontSize: 13 };
const rewardButtonStyle: CSSProperties = { flex: 1, padding: 12, borderRadius: 14, border: "none", background: "#f97316", color: "#fff", fontWeight: 800, cursor: "pointer" };
const rejectButtonStyle: CSSProperties = { flex: 1, padding: 12, borderRadius: 14, border: "none", background: "#ef4444", color: "#fff", fontWeight: 800, cursor: "pointer" };
const disabledRewardButtonStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#cbd5e1", color: "#64748b", fontWeight: 800, cursor: "not-allowed" };
const redeemedBadgeStyle: CSSProperties = { width: "fit-content", padding: "6px 10px", borderRadius: 999, background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 800 };
const requestedBadgeStyle: CSSProperties = { width: "fit-content", padding: "6px 10px", borderRadius: 999, background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 800 };
const reviewButtonRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const balanceBoxStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#eef2ff", color: "#4f46e5", fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 12 };
const fieldLabelStyle: CSSProperties = { display: "block", fontSize: 13, fontWeight: 800, color: "#334155", marginBottom: 6 };
const fieldHintStyle: CSSProperties = { fontSize: 12, color: "#64748b", marginTop: -6, marginBottom: 14, lineHeight: 1.5 };
const presetRowStyle: CSSProperties = { display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" };
const presetButtonStyle: CSSProperties = { flex: 1, minWidth: 60, padding: "10px 0", borderRadius: 12, border: "1px solid #dbeafe", background: "#fff", color: "#4f46e5", fontWeight: 800, cursor: "pointer" };
const presetButtonActiveStyle: CSSProperties = { ...presetButtonStyle, background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" };
const goalBoxStyle: CSSProperties = { padding: 14, borderRadius: 16, background: "#fff7ed", border: "1px solid #fed7aa", marginBottom: 14 };
const goalTitleStyle: CSSProperties = { fontWeight: 800, color: "#9a3412", marginBottom: 8, fontSize: 14 };
const progressTrackStyle: CSSProperties = { height: 10, borderRadius: 999, background: "#fed7aa", overflow: "hidden" };
const progressFillStyle: CSSProperties = { height: "100%", borderRadius: 999, background: "#f97316" };
const goalSubTextStyle: CSSProperties = { marginTop: 6, fontSize: 12, color: "#9a3412", fontWeight: 700 };
const historyBoxStyle: CSSProperties = { marginTop: 4 };
const historyTitleStyle: CSSProperties = { fontSize: 14, fontWeight: 800, color: "#334155", marginBottom: 8 };
const historyEmptyStyle: CSSProperties = { fontSize: 13, color: "#94a3b8", padding: "8px 0" };
const historyRowStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" };
const historyMemoStyle: CSSProperties = { fontSize: 13, color: "#475569" };
const historyDateStyle: CSSProperties = { fontSize: 11, color: "#94a3b8", marginTop: 2 };
const historyAmountPlusStyle: CSSProperties = { color: "#15803d", fontWeight: 800 };
const historyAmountMinusStyle: CSSProperties = { color: "#b91c1c", fontWeight: 800 };
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "#4f46e5", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }; }
