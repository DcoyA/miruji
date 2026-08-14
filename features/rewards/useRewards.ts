"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "@/lib/supabase/client";
import { rewardSelect, rewardTxSelect } from "@/features/workspace/useWorkspace";
import type { Member, Reward, RewardTransaction, Workspace } from "@/types/app";

type UseRewardsParams = {
  workspace: Workspace | null;
  isManager: boolean;
  currentMember: Member | null;
  members: Member[];
  balanceByMemberId: (memberId: string) => number;
  setRewards: Dispatch<SetStateAction<Reward[]>>;
  setRewardTransactions: Dispatch<SetStateAction<RewardTransaction[]>>;
  setMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
};

export function useRewards({
  workspace,
  isManager,
  currentMember,
  members,
  balanceByMemberId,
  setRewards,
  setRewardTransactions,
  setMessage,
  setLoading,
}: UseRewardsParams) {
  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardTargetMemberId, setNewRewardTargetMemberId] = useState("");
  const [newRewardCostPoints, setNewRewardCostPoints] = useState(1);

  function resetRewardState() {
    setNewRewardTitle("");
    setNewRewardDescription("");
    setNewRewardTargetMemberId("");
    setNewRewardCostPoints(1);
  }

  async function createReward() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }
    if (!newRewardTitle.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    if (!newRewardTargetMemberId) {
      setMessage("대상자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager =
      currentMember || members.find((member) => member.role === "owner" || member.role === "manager") || null;

    const { data, error } = await supabase
      .from("rewards")
      .insert({
        workspace_id: workspace.id,
        title: newRewardTitle.trim(),
        description: newRewardDescription.trim() || null,
        requested_by_member_id: newRewardTargetMemberId,
        target_member_id: newRewardTargetMemberId,
        approved_by_member_id: manager?.id || null,
        cost_points: newRewardCostPoints,
        status: "approved",
      })
      .select(rewardSelect)
      .single();

    if (error) {
      setMessage(`보상 등록 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => [data as Reward, ...prev]);
    setNewRewardTitle("");
    setNewRewardDescription("");
    setNewRewardCostPoints(1);
    setMessage("보상 등록 완료");
    setLoading(false);
  }

  async function deleteReward(reward: Reward) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }
    if (reward.status !== "approved") {
      setMessage("승인된 보상만 삭제할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(`"${reward.title}"을 삭제하시겠습니까?`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("rewards").delete().eq("id", reward.id);

    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => prev.filter((item) => item.id !== reward.id));
    setMessage(`${reward.title} 삭제 완료.`);
    setLoading(false);
  }

  async function requestRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (currentMember?.id !== reward.target_member_id) {
      setMessage("본인의 보상만 신청할 수 있습니다.");
      return;
    }
    if (reward.status !== "approved") {
      setMessage("신청할 수 없는 상태입니다.");
      return;
    }

    const balance = balanceByMemberId(reward.target_member_id);
    if (balance < reward.cost_points) {
      setMessage(`포인트가 부족합니다. 필요 ${reward.cost_points} / 보유 ${balance}`);
      return;
    }

    setLoading(true);
    setMessage("");

    if (isManager) {
      const { data: spendData, error: spendError } = await supabase
        .from("reward_transactions")
        .insert({
          workspace_id: workspace.id,
          member_id: reward.target_member_id,
          amount: -reward.cost_points,
          transaction_type: "spend",
          source_type: "reward",
          source_id: reward.id,
          memo: `${reward.title} 교환`,
          created_by_member_id: currentMember?.id || null,
        })
        .select(rewardTxSelect)
        .single();

      if (spendError) {
        setMessage(`포인트 차감 실패: ${spendError.message}`);
        setLoading(false);
        return;
      }

      const { data: updatedReward, error: rewardError } = await supabase
        .from("rewards")
        .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
        .eq("id", reward.id)
        .select(rewardSelect)
        .single();

      if (rewardError) {
        setMessage(`보상 상태 변경 실패: ${rewardError.message}`);
        setLoading(false);
        return;
      }

      setRewardTransactions((prev) => [...prev, spendData as RewardTransaction]);
      setRewards((prev) => prev.map((item) => (item.id === reward.id ? (updatedReward as Reward) : item)));
      setMessage(`교환 완료: ${reward.title}`);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("rewards")
      .update({ status: "requested" })
      .eq("id", reward.id)
      .select(rewardSelect)
      .single();

    if (error) {
      setMessage(`신청 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => prev.map((item) => (item.id === reward.id ? (data as Reward) : item)));
    setMessage(`${reward.title} 신청 완료. 승인을 기다려주세요.`);
    setLoading(false);
  }

  async function confirmRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 승인할 수 있습니다.");
      return;
    }
    if (!reward.target_member_id) {
      setMessage("대상자가 없습니다.");
      return;
    }
    if (reward.status !== "requested") {
      setMessage("신청 상태가 아닙니다.");
      return;
    }

    const balance = balanceByMemberId(reward.target_member_id);
    if (balance < reward.cost_points) {
      setMessage(`포인트가 부족합니다. 필요 ${reward.cost_points} / 보유 ${balance}`);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: spendData, error: spendError } = await supabase
      .from("reward_transactions")
      .insert({
        workspace_id: workspace.id,
        member_id: reward.target_member_id,
        amount: -reward.cost_points,
        transaction_type: "spend",
        source_type: "reward",
        source_id: reward.id,
        memo: `${reward.title} 교환`,
        created_by_member_id: currentMember?.id || null,
      })
      .select(rewardTxSelect)
      .single();

    if (spendError) {
      setMessage(`포인트 차감 실패: ${spendError.message}`);
      setLoading(false);
      return;
    }

    const { data: updatedReward, error: rewardError } = await supabase
      .from("rewards")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() })
      .eq("id", reward.id)
      .select(rewardSelect)
      .single();

    if (rewardError) {
      setMessage(`보상 상태 변경 실패: ${rewardError.message}`);
      setLoading(false);
      return;
    }

    setRewardTransactions((prev) => [...prev, spendData as RewardTransaction]);
    setRewards((prev) => prev.map((item) => (item.id === reward.id ? (updatedReward as Reward) : item)));
    setMessage(`승인 완료: ${reward.title}`);
    setLoading(false);
  }

  async function rejectRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 반려할 수 있습니다.");
      return;
    }
    if (reward.status !== "requested") {
      setMessage("신청 상태가 아닙니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("rewards")
      .update({ status: "approved" })
      .eq("id", reward.id)
      .select(rewardSelect)
      .single();

    if (error) {
      setMessage(`반려 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => prev.map((item) => (item.id === reward.id ? (data as Reward) : item)));
    setMessage(`${reward.title} 신청을 반려했습니다.`);
    setLoading(false);
  }

  return {
    newRewardTitle,
    setNewRewardTitle,
    newRewardDescription,
    setNewRewardDescription,
    newRewardTargetMemberId,
    setNewRewardTargetMemberId,
    newRewardCostPoints,
    setNewRewardCostPoints,
    createReward,
    deleteReward,
    requestRedeem,
    confirmRedeem,
    rejectRedeem,
    resetRewardState,
  };
}
