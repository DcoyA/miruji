
import type { CSSProperties } from "react";
import type { Member, Reward } from "@/types/app";
import { memberNameById } from "@/lib/labels";

type RewardTabProps = {
  members: Member[];
  rewards: Reward[];
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
  onRedeem: (reward: Reward) => void;
};

export default function RewardTab({
  members,
  rewards,
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
  onRedeem,
}: RewardTabProps) {
  const visibleRewards = isManager
    ? rewards
    : rewards.filter((reward) => reward.target_member_id === currentMember?.id);

  const currentBalance = currentMember ? balanceByMemberId(currentMember.id) : 0;

  return (
    <>
      {!isManager && (
        <section style={createBoxStyle}>
          <h2 style={sectionTitleStyle}>내 스티커</h2>
          <div style={balanceBoxStyle}>{currentBalance}개</div>
          <p style={subTextStyle}>참여자는 본인에게 배정된 보상만 확인하고 교환할 수 있습니다.</p>
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

          <input type="number" min={0} value={costPoints} onChange={(event) => onCostPointsChange(Number(event.target.value))} placeholder="필요 스티커 개수" style={inputStyle} />

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
              const canRedeem = reward.status !== "redeemed" && balance >= reward.cost_points;
              return (
                <div key={reward.id} style={rewardCardStyle}>
                  <div>
                    <div style={rewardTitleStyle}>{reward.title}</div>
                    {reward.description && <div style={rewardSubTextStyle}>{reward.description}</div>}
                    <div style={rewardSubTextStyle}>대상: {memberNameById(members, reward.target_member_id)} · 필요 {reward.cost_points}개 · 현재 {balance}개</div>
                  </div>
                  {reward.status === "redeemed" ? (
                    <span style={redeemedBadgeStyle}>교환 완료</span>
                  ) : (
                    <button onClick={() => onRedeem(reward)} disabled={loading || !canRedeem} style={canRedeem ? rewardButtonStyle : disabledRewardButtonStyle}>교환하기</button>
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
const rewardButtonStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#f97316", color: "#fff", fontWeight: 800, cursor: "pointer" };
const disabledRewardButtonStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#cbd5e1", color: "#64748b", fontWeight: 800, cursor: "not-allowed" };
const redeemedBadgeStyle: CSSProperties = { width: "fit-content", padding: "6px 10px", borderRadius: 999, background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 800 };
const balanceBoxStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#eef2ff", color: "#4f46e5", fontSize: 28, fontWeight: 900, textAlign: "center", marginBottom: 12 };
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "#4f46e5", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }; }
