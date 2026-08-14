"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import NotificationPrompt from "@/features/notifications/NotificationPrompt";

import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import AuthPanel from "@/components/AuthPanel";
import BottomNav from "@/components/BottomNav";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";

import CalendarGrid from "@/features/calendar/CalendarGrid";
import CalendarToolbar from "@/features/calendar/CalendarToolbar";
import DayTaskList from "@/features/calendar/DayTaskList";
import SummaryStrip from "@/features/calendar/SummaryStrip";
import MissionTab from "@/features/missions/MissionTab";
import RewardTab from "@/features/rewards/RewardTab";
import TaskList from "@/features/tasks/TaskList";
import SettingsTab from "@/features/settings/SettingsTab";

import { addMonths, endOfMonth, startOfMonth, toDateKey } from "@/lib/date";
import { tabTitle, roleLabel } from "@/lib/labels";

import OnboardingGate, { type OnboardingStep } from "@/features/onboarding/OnboardingGate";
import NoWorkspacePrompt from "@/features/onboarding/NoWorkspacePrompt";

import { useAuth } from "@/features/auth/useAuth";
import {
  useWorkspace,
  taskSelect,
  taskTemplateSelect,
  rewardSelect,
  rewardTxSelect,
} from "@/features/workspace/useWorkspace";

import type {
  ActiveTab,
  Member,
  Reward,
  RewardTransaction,
  Task,
  TaskTemplate,
} from "@/types/app";

type RepeatType = "none" | "daily" | "weekly";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignedMemberId, setNewTaskAssignedMemberId] = useState("");
  const [newTaskVerificationType, setNewTaskVerificationType] = useState("none");
  const [newTaskDueTime, setNewTaskDueTime] = useState("");
  const [newTaskRewardPoints, setNewTaskRewardPoints] = useState(1);
  const [newTaskRepeatType, setNewTaskRepeatType] = useState<RepeatType>("none");
  const [newTaskRepeatWeekdays, setNewTaskRepeatWeekdays] = useState<number[]>([]);

  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardTargetMemberId, setNewRewardTargetMemberId] = useState("");
  const [newRewardCostPoints, setNewRewardCostPoints] = useState(1);

  const [summaryFilter, setSummaryFilter] = useState<"all" | "pending" | "approved" | null>(null);

  const auth = useAuth({ setMessage, setLoading });
  const {
    authLoading,
    authMode,
    setAuthMode,
    authUsername,
    setAuthUsername,
    authRecoveryEmail,
    setAuthRecoveryEmail,
    isHuman,
    setIsHuman,
    rememberUsername,
    setRememberUsername,
    authPassword,
    setAuthPassword,
    agreedToTerms,
    setAgreedToTerms,
    profile,
    profileRecoveryEmail,
    setProfileRecoveryEmail,
    newPassword,
    setNewPassword,
    signUp,
    signIn,
    requestPasswordReset,
    signOut,
    deleteAccount,
    saveRecoveryEmail,
    changePassword,
    markOnboardingComplete,
  } = auth;

  const workspaceHook = useWorkspace({
    profile,
    loading,
    currentMonth,
    setMessage,
    setLoading,
    setActiveTab,
  });
  const {
    workspaces,
    workspace,
    setWorkspace,
    workspacesLoaded,
    workspaceName,
    setWorkspaceName,
    workspaceDescription,
    setWorkspaceDescription,
    onboardingStep,
    setOnboardingStep,
    members,
    currentMember,
    isManager,
    activeMembers,
    tasks,
    setTasks,
    templates,
    setTemplates,
    rewards,
    setRewards,
    rewardTransactions,
    setRewardTransactions,
    newMemberName,
    setNewMemberName,
    newMemberRole,
    setNewMemberRole,
    inviteRole,
    setInviteRole,
    inviteSuggestedName,
    setInviteSuggestedName,
    pendingInvites,
    joinInviteCode,
    setJoinInviteCode,
    pendingInviteCode,
    myNickname,
    setMyNickname,
    loadWorkspaces,
    createWorkspace,
    addVirtualMember,
    createInvite,
    cancelPendingInvite,
    removeMember,
    restoreMember,
    updateMemberRole,
    saveMyNickname,
    acceptInviteCode,
    transferOwnership,
    deleteWorkspace,
    resetWorkspaceState,
    balanceByMemberId,
  } = workspaceHook;

  // profile 값이 바뀔 때 워크스페이스를 불러오거나 초기화합니다.
  // (useAuth와 useWorkspace가 서로를 직접 참조하지 않도록 여기서 연결합니다.)
  useEffect(() => {
    if (profile) {
      loadWorkspaces();
    } else {
      resetWorkspaceState();
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskAssignedMemberId("");
      setNewTaskVerificationType("none");
      setNewTaskRewardPoints(1);
      setNewTaskRepeatType("none");
      setNewTaskRepeatWeekdays([]);
      setNewRewardTitle("");
      setNewRewardDescription("");
      setNewRewardTargetMemberId("");
      setNewRewardCostPoints(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  useEffect(() => {
    if (profile && workspacesLoaded && !profile.onboarding_completed && workspaces.length > 0) {
      markOnboardingComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.onboarding_completed, workspacesLoaded, workspaces.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const selectedTasks = useMemo(() => {
    return tasks.filter((task) => task.due_date === selectedDate);
  }, [tasks, selectedDate]);

  const monthTaskCount = tasks.length;
  const pendingCount = tasks.filter((task) => task.status === "submitted").length;
  const approvedCount = tasks.filter((task) => task.status === "approved").length;

  const summaryFilteredTasks = useMemo(() => {
    if (summaryFilter === "pending") return tasks.filter((task) => task.status === "submitted");
    if (summaryFilter === "approved") return tasks.filter((task) => task.status === "approved");
    if (summaryFilter === "all") return tasks;
    return [];
  }, [tasks, summaryFilter]);

  function toggleRepeatWeekday(day: number) {
    setNewTaskRepeatWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function createTask() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!newTaskTitle.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }
    if (!newTaskAssignedMemberId) {
      setMessage("담당자를 선택해주세요.");
      return;
    }
    if (newTaskRepeatType === "weekly" && newTaskRepeatWeekdays.length === 0) {
      setMessage("반복할 요일을 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const creatorMemberId = currentMember?.id || members.find((member) => member.role === "owner" || member.role === "manager")?.id || null;

    if (newTaskRepeatType === "none") {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          workspace_id: workspace.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          task_type: "custom",
          status: "todo",
          due_date: selectedDate,
          assigned_member_id: newTaskAssignedMemberId,
          verification_type: newTaskVerificationType,
          due_time: newTaskDueTime || null,
          verification_required: newTaskVerificationType !== "none",
          reward_points: newTaskRewardPoints,
          rollover_enabled: true,
          created_by_member_id: creatorMemberId,
        })
        .select(taskSelect)
        .single();

      if (error) {
        setMessage(`할 일 등록 실패: ${error.message}`);
        setLoading(false);
        return;
      }

      setTasks((prev) => [...prev, data as Task]);
      setMessage("할 일 등록 완료");
    } else {
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .insert({
          workspace_id: workspace.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          assigned_member_id: newTaskAssignedMemberId,
          verification_type: newTaskVerificationType,
          due_time: newTaskDueTime || null,
          reward_points: newTaskRewardPoints,
          rollover_enabled: true,
          repeat_type: newTaskRepeatType,
          repeat_weekdays: newTaskRepeatType === "weekly" ? newTaskRepeatWeekdays : [],
          is_active: true,
          created_by_member_id: creatorMemberId,
        })
        .select(taskTemplateSelect)
        .single();

      if (templateError) {
        setMessage(`반복 할 일 등록 실패: ${templateError.message}`);
        setLoading(false);
        return;
      }

      setTemplates((prev) => [...prev, templateData as TaskTemplate]);

      const { error: generateError } = await supabase.rpc("generate_recurring_tasks");

      if (generateError) {
        setMessage(`반복 할 일 생성 실패: ${generateError.message}`);
        setLoading(false);
        return;
      }

      await workspaceHook.loadWorkspaceData(workspace.id);
      setMessage("반복 할 일 등록 완료");
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setNewTaskRepeatType("none");
    setNewTaskRepeatWeekdays([]);
    setNewTaskDueTime("");
    setLoading(false);
  }

  async function toggleTemplateActive(template: TaskTemplate) {
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("task_templates")
      .update({ is_active: !template.is_active })
      .eq("id", template.id)
      .select(taskTemplateSelect)
      .single();

    if (error) {
      setMessage(`반복 할 일 상태 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    const updated = data as TaskTemplate;
    setTemplates((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
    setMessage(`${template.title} ${updated.is_active ? "활성화" : "비활성화"}`);
    setLoading(false);
  }

  async function deleteTemplate(template: TaskTemplate) {
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    const confirmed = window.confirm(
      `"${template.title}"을 삭제하시겠습니까? 이후 반복 생성이 중단됩니다.`
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("task_templates").delete().eq("id", template.id);

    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTemplates((prev) => prev.filter((item) => item.id !== template.id));
    setMessage(`${template.title} 삭제 완료`);
    setLoading(false);
  }

  async function rolloverNow() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.rpc("rollover_overdue_tasks");

    if (error) {
      setMessage(`이월 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    await workspaceHook.loadWorkspaceData(workspace.id);
    setMessage("미완료 할 일을 이월했습니다.");
    setLoading(false);
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

    const manager = currentMember || members.find((member) => member.role === "owner" || member.role === "manager") || null;

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

  async function submitTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출 완료.`);
    setLoading(false);
  }

  async function submitTaskWithText(task: Task, text: string) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }
    if (!text.trim()) {
      setMessage("증거 텍스트를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted", evidence_text: text.trim() })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출 완료.`);
    setLoading(false);
  }

  async function submitTaskWithEvidence(task: Task, file: File) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 제출할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const filePath = `${workspace.id}/${task.id}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("task-evidence")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setMessage(`업로드 실패: ${uploadError.message}`);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("task-evidence").getPublicUrl(filePath);

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "submitted", evidence_url: publicUrlData.publicUrl })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`제출 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 증거 제출 완료.`);
    setLoading(false);
  }

  async function cancelSubmission(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 취소할 수 있습니다.");
      return;
    }
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("담당자만 취소할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "todo" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`취소 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 제출을 취소했습니다.`);
    setLoading(false);
  }

  async function deleteTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canDelete = isManager || task.created_by_member_id === currentMember?.id;
    if (!canDelete) {
      setMessage("본인이 만든 할 일 또는 방장/부방장만 삭제할 수 있습니다.");
      return;
    }

    const confirmed = window.confirm(`"${task.title}"을 삭제하시겠습니까? 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      setMessage(`삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    setMessage(`${task.title} 삭제 완료`);
    setLoading(false);
  }

  async function approveTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canReview =
      isManager || (!!currentMember?.id && task.created_by_member_id === currentMember.id);
    if (!canReview) {
      setMessage("이 할 일을 만든 사람 또는 방장/부방장만 승인할 수 있습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 승인할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "approved" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`승인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));

    if (task.assigned_member_id && task.reward_points > 0) {
      const { data: txData, error: txError } = await supabase
        .from("reward_transactions")
        .insert({
          workspace_id: workspace.id,
          member_id: task.assigned_member_id,
          amount: task.reward_points,
          transaction_type: "earn",
          source_type: "task",
          source_id: task.id,
          memo: `${task.title} 완료`,
          created_by_member_id: currentMember?.id || null,
        })
        .select(rewardTxSelect)
        .single();

      if (txError) {
        setMessage(`포인트 지급 실패: ${txError.message}`);
        setLoading(false);
        return;
      }

      setRewardTransactions((prev) => [...prev, txData as RewardTransaction]);
    }

    setMessage(`${task.title} 승인 및 포인트 지급 완료`);
    setLoading(false);
  }

  async function rejectTask(task: Task) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return;
    }

    const canReview =
      isManager || (!!currentMember?.id && task.created_by_member_id === currentMember.id);
    if (!canReview) {
      setMessage("이 할 일을 만든 사람 또는 방장/부방장만 승인할 수 있습니다.");
      return;
    }
    if (task.status !== "submitted") {
      setMessage("제출된 상태만 반려할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "rejected" })
      .eq("id", task.id)
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`반려 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
    setMessage(`${task.title} 반려했습니다.`);
    setLoading(false);
  }

  if (authLoading) {
    return (
      <Shell>
        <h1 style={titleStyle}>미루지</h1>
        <p style={subTextStyle}>로그인 상태 확인 중...</p>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <AuthPanel
          mode={authMode}
          username={authUsername}
          password={authPassword}
          recoveryEmail={authRecoveryEmail}
          loading={loading}
          message={message}
          agreedToTerms={agreedToTerms}
          isHuman={isHuman}
          rememberUsername={rememberUsername}
          onModeChange={setAuthMode}
          onUsernameChange={setAuthUsername}
          onPasswordChange={setAuthPassword}
          onRecoveryEmailChange={setAuthRecoveryEmail}
          onAgreedToTermsChange={setAgreedToTerms}
          onIsHumanChange={setIsHuman}
          onRememberUsernameChange={setRememberUsername}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      </Shell>
    );
  }

  if (!workspacesLoaded) {
    return (
      <Shell>
        <h1 style={titleStyle}>미루지</h1>
        <p style={subTextStyle}>모임 정보 불러오는 중...</p>
      </Shell>
    );
  }

  const needsOnboarding = !profile.onboarding_completed && workspaces.length === 0;

  if (needsOnboarding) {
    if (pendingInviteCode) {
      return (
        <Shell>
          <AppHeader title="미루지" loading={loading} onSignOut={signOut} />
          <h1 style={titleStyle}>초대 확인 중...</h1>
          <p style={subTextStyle}>잠시만 기다려주세요. 초대코드를 처리하고 있습니다.</p>
          {message && <div style={messageBoxStyle(message)}>{message}</div>}
        </Shell>
      );
    }

    return (
      <Shell>
        <AppHeader title="미루지" loading={loading} onSignOut={signOut} />
        <OnboardingGate
          step={onboardingStep}
          loading={loading}
          message={message}
          onChooseCreate={() => setOnboardingStep("create")}
          onChooseJoin={() => setOnboardingStep("join")}
          onBack={() => setOnboardingStep("choice")}
          workspaceName={workspaceName}
          workspaceDescription={workspaceDescription}
          onWorkspaceNameChange={setWorkspaceName}
          onWorkspaceDescriptionChange={setWorkspaceDescription}
          onCreateWorkspace={createWorkspace}
          joinInviteCode={joinInviteCode}
          onJoinInviteCodeChange={setJoinInviteCode}
          onAcceptInvite={() => acceptInviteCode()}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <AppHeader title={tabTitle(activeTab)} loading={loading} onSignOut={signOut} />

      <section style={accountBoxStyle}>
        <div style={avatarStyle}>
          {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={accountInfoStyle}>
          <strong style={accountNameStyle}>{currentMember?.display_name || profile.display_name}</strong>
          {currentMember && (
            <span style={roleBadgeStyle}>{roleLabel(currentMember.role)}</span>
          )}
        </div>
        <a href="/dev" style={devLinkStyle}>dev</a>
      </section>

      {workspace && <NotificationPrompt />}

      {workspaces.length > 0 && (
        <WorkspaceSwitcher
          workspaces={workspaces}
          currentWorkspaceId={workspace?.id ?? ""}
          onSelect={(id) => {
            const next = workspaces.find((item) => item.id === id) || null;
            setWorkspace(next);
          }}
        />
      )}

      {workspace && activeTab === "calendar" && (
        <>
          <SummaryStrip
            monthTaskCount={monthTaskCount}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            onClickMonth={() => setSummaryFilter("all")}
            onClickPending={() => setSummaryFilter("pending")}
            onClickApproved={() => setSummaryFilter("approved")}
          />
          <CalendarToolbar
            currentMonth={currentMonth}
            onPrev={() => setCurrentMonth(addMonths(currentMonth, -1))}
            onNext={() => setCurrentMonth(addMonths(currentMonth, 1))}
            onToday={() => {
              const today = new Date();
              setCurrentMonth(startOfMonth(today));
              setSelectedDate(toDateKey(today));
            }}
          />
          <CalendarGrid currentMonth={currentMonth} selectedDate={selectedDate} tasks={tasks} onSelectDate={setSelectedDate} />
          <DayTaskList
            selectedDate={selectedDate}
            tasks={selectedTasks}
            monthTasks={tasks}
            members={activeMembers}
            currentMember={currentMember}
            isManager={isManager}
            loading={loading}
            onSelectDate={setSelectedDate}
            onSubmitTask={submitTask}
            onApproveTask={approveTask}
            onRejectTask={rejectTask}
            onCancelTask={cancelSubmission}
            onDeleteTask={deleteTask}
            onAddTask={() => setActiveTab("missions")}
            onSubmitWithEvidence={submitTaskWithEvidence}
            onSubmitWithText={submitTaskWithText}
          />
        </>
      )}

      {workspace && activeTab === "missions" && (
        <MissionTab
          selectedDate={selectedDate}
          members={activeMembers}
          tasks={selectedTasks}
          templates={templates}
          currentMember={currentMember}
          isManager={isManager}
          title={newTaskTitle}
          description={newTaskDescription}
          assignedMemberId={newTaskAssignedMemberId}
          verificationType={newTaskVerificationType}
          dueTime={newTaskDueTime}
          onDueTimeChange={setNewTaskDueTime}
          rewardPoints={newTaskRewardPoints}
          repeatType={newTaskRepeatType}
          repeatWeekdays={newTaskRepeatWeekdays}
          loading={loading}
          onTitleChange={setNewTaskTitle}
          onDescriptionChange={setNewTaskDescription}
          onAssignedMemberIdChange={setNewTaskAssignedMemberId}
          onVerificationTypeChange={setNewTaskVerificationType}
          onRewardPointsChange={setNewTaskRewardPoints}
          onRepeatTypeChange={setNewTaskRepeatType}
          onToggleRepeatWeekday={toggleRepeatWeekday}
          onCreate={createTask}
          onSubmitTask={submitTask}
          onApproveTask={approveTask}
          onRejectTask={rejectTask}
          onToggleTemplateActive={toggleTemplateActive}
          onDeleteTemplate={deleteTemplate}
          onRolloverNow={rolloverNow}
          onSelectedDateChange={setSelectedDate}
          onCancelTask={cancelSubmission}
          onDeleteTask={deleteTask}
          onSubmitWithEvidence={submitTaskWithEvidence}
          onSubmitWithText={submitTaskWithText}
        />
      )}

      {workspace && activeTab === "rewards" && (
        <RewardTab
          members={activeMembers}
          rewards={rewards}
          transactions={rewardTransactions}
          currentMember={currentMember}
          isManager={isManager}
          title={newRewardTitle}
          description={newRewardDescription}
          targetMemberId={newRewardTargetMemberId}
          costPoints={newRewardCostPoints}
          loading={loading}
          balanceByMemberId={balanceByMemberId}
          onTitleChange={setNewRewardTitle}
          onDescriptionChange={setNewRewardDescription}
          onTargetMemberIdChange={setNewRewardTargetMemberId}
          onCostPointsChange={setNewRewardCostPoints}
          onCreate={createReward}
          onRequestRedeem={requestRedeem}
          onConfirmRedeem={confirmRedeem}
          onRejectRedeem={rejectRedeem}
          onDeleteReward={deleteReward}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab
          workspaces={workspaces}
          workspace={workspace}
          members={members}
          currentMember={currentMember}
          isManager={isManager}
          workspaceName={workspaceName}
          workspaceDescription={workspaceDescription}
          loading={loading}
          onWorkspaceNameChange={setWorkspaceName}
          onWorkspaceDescriptionChange={setWorkspaceDescription}
          onCreateWorkspace={createWorkspace}
          newMemberName={newMemberName}
          newMemberRole={newMemberRole}
          onNewMemberNameChange={setNewMemberName}
          onNewMemberRoleChange={setNewMemberRole}
          onAddMember={addVirtualMember}
          inviteRole={inviteRole}
          onInviteRoleChange={setInviteRole}
          inviteSuggestedName={inviteSuggestedName}
          onInviteSuggestedNameCh
