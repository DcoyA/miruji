"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string;
  avatar_url: string | null;
  onboarding_completed: boolean;
};

type Workspace = {
  id: string;
  name: string;
  description: string | null;
};

type Member = {
  id: string;
  display_name: string;
  role: "owner" | "manager" | "member";
  is_virtual: boolean;
};

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  due_date: string | null;
  assigned_member_id: string | null;
  verification_type: string;
  verification_required: boolean;
  reward_points: number;
};

type Reward = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  requested_by_member_id: string | null;
  target_member_id: string | null;
  cost_points: number;
  status: string;
};

type RewardTransaction = {
  id: string;
  member_id: string;
  amount: number;
  transaction_type: string;
  source_type: string;
  source_id: string | null;
};

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<"manager" | "member">("member");
  const [members, setMembers] = useState<Member[]>([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedMemberId, setTaskAssignedMemberId] = useState("");
  const [taskType, setTaskType] = useState("habit");
  const [verificationType, setVerificationType] = useState("none");
  const [rewardPoints, setRewardPoints] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [rewardTargetMemberId, setRewardTargetMemberId] = useState("");
  const [rewardCostPoints, setRewardCostPoints] = useState(1);
  const [rewards, setRewards] = useState<Reward[]>([]);

  const [rewardTransactions, setRewardTransactions] = useState<
    RewardTransaction[]
  >([]);

  const [activeSubmitTaskId, setActiveSubmitTaskId] = useState<string | null>(
    null
  );
  const [submissionText, setSubmissionText] = useState("");

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
        await loadWorkspaces();
      } else {
        setCurrentProfile(null);
        setWorkspaces([]);
        setWorkspace(null);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function initializeAuth() {
    setAuthLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setCurrentProfile(null);
      setInitialLoading(false);
      setAuthLoading(false);
      return;
    }

    const profile = await loadProfile(data.user.id);

    if (profile) {
      await loadWorkspaces();
    }

    setInitialLoading(false);
    setAuthLoading(false);
  }

  async function loadProfile(authUserId: string): Promise<Profile | null> {
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email || "사용자";

    const { data, error } = await supabase
      .from("profiles")
      .select("id, auth_user_id, display_name, avatar_url, onboarding_completed")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      setMessage(`프로필 불러오기 실패: ${error.message}`);
      setCurrentProfile(null);
      return null;
    }

    if (data) {
      setCurrentProfile(data as Profile);
      return data as Profile;
    }

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        auth_user_id: authUserId,
        display_name: email.split("@")[0],
        onboarding_completed: false,
      })
      .select("id, auth_user_id, display_name, avatar_url, onboarding_completed")
      .single();

    if (createError) {
      setMessage(`프로필 생성 실패: ${createError.message}`);
      setCurrentProfile(null);
      return null;
    }

    setCurrentProfile(createdProfile as Profile);
    return createdProfile as Profile;
  }

  async function signUp() {
    if (!authEmail.trim() || !authPassword.trim()) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword.trim(),
      options: {
        data: {
          display_name: authEmail.split("@")[0],
        },
      },
    });

    if (error) {
      setMessage(`회원가입 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("회원가입 완료. 인증 메일을 확인한 뒤 로그인해주세요.");
    setLoading(false);
  }

  async function signIn() {
    if (!authEmail.trim() || !authPassword.trim()) {
      setMessage("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword.trim(),
    });

    if (error) {
      setMessage(`로그인 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("로그인 사용자 정보를 가져오지 못했습니다.");
      setLoading(false);
      return;
    }

    const profile = await loadProfile(data.user.id);

    if (!profile) {
      setLoading(false);
      return;
    }

    await loadWorkspaces();
    setMessage("로그인 성공");
    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(`로그아웃 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setCurrentProfile(null);
    setWorkspace(null);
    setWorkspaces([]);
    setMembers([]);
    setTasks([]);
    setRewards([]);
    setRewardTransactions([]);

    setMessage("로그아웃 완료");
    setLoading(false);
  }
  
  async function loadWorkspaces() {
    setInitialLoading(true);

    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, description")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`워크스페이스 목록 불러오기 실패: ${error.message}`);
      setInitialLoading(false);
      return;
    }

    setWorkspaces((data || []) as Workspace[]);
    setInitialLoading(false);
  }

  async function selectWorkspace(selected: Workspace) {
    setLoading(true);
    setMessage("");

    const [
      membersResult,
      tasksResult,
      rewardsResult,
      rewardTransactionsResult,
    ] = await Promise.all([
      supabase
        .from("workspace_members")
        .select("id, display_name, role, is_virtual")
        .eq("workspace_id", selected.id)
        .order("created_at", { ascending: true }),

      supabase
        .from("tasks")
        .select(
          "id, workspace_id, title, description, task_type, status, due_date, assigned_member_id, verification_type, verification_required, reward_points"
        )
        .eq("workspace_id", selected.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("rewards")
        .select(
          "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status"
        )
        .eq("workspace_id", selected.id)
        .order("created_at", { ascending: false }),

      supabase
        .from("reward_transactions")
        .select("id, member_id, amount, transaction_type, source_type, source_id")
        .eq("workspace_id", selected.id)
        .order("created_at", { ascending: true }),
    ]);

    if (membersResult.error) {
      setMessage(`참여자 불러오기 실패: ${membersResult.error.message}`);
      setLoading(false);
      return;
    }

    if (tasksResult.error) {
      setMessage(`미션 불러오기 실패: ${tasksResult.error.message}`);
      setLoading(false);
      return;
    }

    if (rewardsResult.error) {
      setMessage(`보상 불러오기 실패: ${rewardsResult.error.message}`);
      setLoading(false);
      return;
    }

    if (rewardTransactionsResult.error) {
      setMessage(
        `스티커 내역 불러오기 실패: ${rewardTransactionsResult.error.message}`
      );
      setLoading(false);
      return;
    }

    setWorkspace(selected);
    setMembers((membersResult.data || []) as Member[]);
    setTasks((tasksResult.data || []) as Task[]);
    setRewards((rewardsResult.data || []) as Reward[]);
    setRewardTransactions(
      (rewardTransactionsResult.data || []) as RewardTransaction[]
    );

    setShowCreateWorkspace(false);
    setMessage(`${selected.name} 데이터를 불러왔습니다.`);
    setLoading(false);
  }

  function goBackToWorkspaceList() {
    setWorkspace(null);
    setMembers([]);
    setTasks([]);
    setRewards([]);
    setRewardTransactions([]);
    setActiveSubmitTaskId(null);
    setSubmissionText("");
    setMessage("");
    loadWorkspaces();
  }

  async function createWorkspace() {
    if (!workspaceName.trim()) {
      setMessage("워크스페이스 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || null,
      })
      .select("id, name, description")
      .single();

    if (error) {
      setMessage(`워크스페이스 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setWorkspaces((prev) => [data as Workspace, ...prev]);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setShowCreateWorkspace(false);

    await selectWorkspace(data as Workspace);
    setMessage(`워크스페이스 생성 완료: ${data.name}`);
    setLoading(false);
  }

  async function addMember() {
    if (!workspace) {
      setMessage("먼저 워크스페이스를 선택해주세요.");
      return;
    }

    if (!memberName.trim()) {
      setMessage("참여자 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        display_name: memberName.trim(),
        role: memberRole,
        status: "active",
        is_virtual: true,
      })
      .select("id, display_name, role, is_virtual")
      .single();

    if (error) {
      setMessage(`참여자 추가 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => [...prev, data as Member]);
    setMemberName("");
    setMemberRole("member");
    setMessage(`참여자 추가 완료: ${data.display_name}`);
    setLoading(false);
  }

  async function createTask() {
    if (!workspace) {
      setMessage("먼저 워크스페이스를 선택해주세요.");
      return;
    }

    if (!taskTitle.trim()) {
      setMessage("미션 제목을 입력해주세요.");
      return;
    }

    if (!taskAssignedMemberId) {
      setMessage("미션을 받을 참여자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        workspace_id: workspace.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        task_type: taskType,
        status: "todo",
        due_date: new Date().toISOString().slice(0, 10),
        assigned_member_id: taskAssignedMemberId,
        verification_type: verificationType,
        verification_required: verificationType !== "none",
        reward_points: rewardPoints,
        rollover_enabled: true,
      })
      .select(
        "id, workspace_id, title, description, task_type, status, due_date, assigned_member_id, verification_type, verification_required, reward_points"
      )
      .single();

    if (error) {
      setMessage(`미션 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => [data as Task, ...prev]);
    setTaskTitle("");
    setTaskDescription("");
    setVerificationType("none");
    setRewardPoints(1);
    setMessage(`미션 생성 완료: ${data.title}`);
    setLoading(false);
  }

  async function submitTask(task: Task) {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }

    if (task.status !== "todo") {
      setMessage("이미 제출된 미션입니다.");
      return;
    }

    if (task.verification_type === "text" && !submissionText.trim()) {
      setMessage("텍스트 인증 내용을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error: submissionError } = await supabase
      .from("task_submissions")
      .insert({
        task_id: task.id,
        workspace_id: workspace.id,
        submitted_by_member_id: task.assigned_member_id,
        submission_text: submissionText.trim() || null,
        status: "submitted",
      });

    if (submissionError) {
      setMessage(`인증 제출 실패: ${submissionError.message}`);
      setLoading(false);
      return;
    }

    const { data: updatedTask, error: taskUpdateError } = await supabase
      .from("tasks")
      .update({
        status: "submitted",
      })
      .eq("id", task.id)
      .select(
        "id, workspace_id, title, description, task_type, status, due_date, assigned_member_id, verification_type, verification_required, reward_points"
      )
      .single();

    if (taskUpdateError) {
      setMessage(`미션 상태 변경 실패: ${taskUpdateError.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? (updatedTask as Task) : item))
    );

    setSubmissionText("");
    setActiveSubmitTaskId(null);
    setMessage(`인증 제출 완료: ${task.title}`);
    setLoading(false);
  }

  async function approveTask(task: Task) {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }

    if (!task.assigned_member_id) {
      setMessage("미션 대상자가 없습니다.");
      return;
    }

    if (task.status !== "submitted") {
      setMessage("승인 대기 상태의 미션만 승인할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager = members.find((member) => member.role === "manager");

    const { error: approvalError } = await supabase.from("approvals").insert({
      workspace_id: workspace.id,
      task_id: task.id,
      requested_by_member_id: task.assigned_member_id,
      approved_by_member_id: manager?.id || null,
      status: "approved",
      comment: "참 잘했어요!",
      approved_at: new Date().toISOString(),
    });

    if (approvalError) {
      setMessage(`승인 기록 생성 실패: ${approvalError.message}`);
      setLoading(false);
      return;
    }

    const { data: rewardData, error: rewardError } = await supabase
      .from("reward_transactions")
      .insert({
        workspace_id: workspace.id,
        member_id: task.assigned_member_id,
        amount: task.reward_points,
        transaction_type: "earn",
        source_type: "task",
        source_id: task.id,
        memo: `${task.title} 승인 보상`,
        created_by_member_id: manager?.id || null,
      })
      .select("id, member_id, amount, transaction_type, source_type, source_id")
      .single();

    if (rewardError) {
      setMessage(`스티커 지급 실패: ${rewardError.message}`);
      setLoading(false);
      return;
    }

    const { data: updatedTask, error: taskUpdateError } = await supabase
      .from("tasks")
      .update({
        status: "approved",
      })
      .eq("id", task.id)
      .select(
        "id, workspace_id, title, description, task_type, status, due_date, assigned_member_id, verification_type, verification_required, reward_points"
      )
      .single();

    if (taskUpdateError) {
      setMessage(`미션 승인 상태 변경 실패: ${taskUpdateError.message}`);
      setLoading(false);
      return;
    }

    setRewardTransactions((prev) => [
      ...prev,
      rewardData as RewardTransaction,
    ]);
    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? (updatedTask as Task) : item))
    );

    setMessage(
      `승인 완료: ${task.title} · 스티커 ${task.reward_points}개 지급`
    );
    setLoading(false);
  }

  async function rejectTask(task: Task) {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }

    if (task.status !== "submitted") {
      setMessage("승인 대기 상태의 미션만 반려할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager = members.find((member) => member.role === "manager");

    const { error: approvalError } = await supabase.from("approvals").insert({
      workspace_id: workspace.id,
      task_id: task.id,
      requested_by_member_id: task.assigned_member_id,
      approved_by_member_id: manager?.id || null,
      status: "rejected",
      comment: "다시 한번 해볼까요?",
      approved_at: new Date().toISOString(),
    });

    if (approvalError) {
      setMessage(`반려 기록 생성 실패: ${approvalError.message}`);
      setLoading(false);
      return;
    }

    const { data: updatedTask, error: taskUpdateError } = await supabase
      .from("tasks")
      .update({
        status: "rejected",
      })
      .eq("id", task.id)
      .select(
        "id, workspace_id, title, description, task_type, status, due_date, assigned_member_id, verification_type, verification_required, reward_points"
      )
      .single();

    if (taskUpdateError) {
      setMessage(`미션 반려 상태 변경 실패: ${taskUpdateError.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) =>
      prev.map((item) => (item.id === task.id ? (updatedTask as Task) : item))
    );

    setMessage(`반려 완료: ${task.title}`);
    setLoading(false);
  }

  async function createReward() {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }

    if (!rewardTitle.trim()) {
      setMessage("보상 이름을 입력해주세요.");
      return;
    }

    if (!rewardTargetMemberId) {
      setMessage("보상을 받을 참여자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const requester = members.find(
      (member) => member.id === rewardTargetMemberId
    );
    const manager = members.find((member) => member.role === "manager");

    const { data, error } = await supabase
      .from("rewards")
      .insert({
        workspace_id: workspace.id,
        title: rewardTitle.trim(),
        description: rewardDescription.trim() || null,
        requested_by_member_id: requester?.id || null,
        target_member_id: rewardTargetMemberId,
        approved_by_member_id: manager?.id || null,
        cost_points: rewardCostPoints,
        status: "approved",
      })
      .select(
        "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status"
      )
      .single();

    if (error) {
      setMessage(`보상 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => [data as Reward, ...prev]);
    setRewardTitle("");
    setRewardDescription("");
    setRewardCostPoints(1);
    setMessage(`보상 생성 완료: ${data.title}`);
    setLoading(false);
  }

  async function redeemReward(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }

    if (!reward.target_member_id) {
      setMessage("보상 대상자가 없습니다.");
      return;
    }

    if (reward.status === "redeemed") {
      setMessage("이미 교환한 보상입니다.");
      return;
    }

    const balance = balanceByMemberId(reward.target_member_id);

    if (balance < reward.cost_points) {
      setMessage(
        `스티커가 부족합니다. 필요 ${reward.cost_points}개 / 현재 ${balance}개`
      );
      return;
    }

    setLoading(true);
    setMessage("");

    const manager = members.find((member) => member.role === "manager");

    const { data: spendData, error: spendError } = await supabase
      .from("reward_transactions")
      .insert({
        workspace_id: workspace.id,
        member_id: reward.target_member_id,
        amount: -reward.cost_points,
        transaction_type: "spend",
        source_type: "reward",
        source_id: reward.id,
        memo: `${reward.title} 보상 교환`,
        created_by_member_id: manager?.id || null,
      })
      .select("id, member_id, amount, transaction_type, source_type, source_id")
      .single();

    if (spendError) {
      setMessage(`스티커 차감 실패: ${spendError.message}`);
      setLoading(false);
      return;
    }

    const { data: updatedReward, error: rewardUpdateError } = await supabase
      .from("rewards")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", reward.id)
      .select(
        "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status"
      )
      .single();

    if (rewardUpdateError) {
      setMessage(`보상 상태 변경 실패: ${rewardUpdateError.message}`);
      setLoading(false);
      return;
    }

    setRewardTransactions((prev) => [
      ...prev,
      spendData as RewardTransaction,
    ]);
    setRewards((prev) =>
      prev.map((item) =>
        item.id === reward.id ? (updatedReward as Reward) : item
      )
    );

    setMessage(
      `보상 교환 완료: ${reward.title} · 스티커 ${reward.cost_points}개 사용`
    );
    setLoading(false);
  }

  function memberNameById(id: string | null) {
    if (!id) return "미지정";
    return members.find((member) => member.id === id)?.display_name || "미지정";
  }

  function balanceByMemberId(memberId: string) {
    return rewardTransactions
      .filter((item) => item.member_id === memberId)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  if (initialLoading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>미루지말자</h1>
          <p style={subTextStyle}>데이터를 불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {!workspace ? (
          <>
            <h1 style={titleStyle}>미루지말자</h1>
            <p style={subTextStyle}>
              기존 워크스페이스를 선택하거나 새 공간을 만들어보세요
            </p>

            {workspaces.length > 0 && !showCreateWorkspace && (
              <section>
                <h2 style={sectionTitleStyle}>기존 워크스페이스</h2>

                <div style={listStyle}>
                  {workspaces.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectWorkspace(item)}
                      disabled={loading}
                      style={workspaceSelectButtonStyle}
                    >
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div
                            style={{
                              marginTop: 4,
                              color: "#64748b",
                              fontSize: 13,
                            }}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      <span style={{ color: "#4f46e5", fontWeight: 800 }}>
                        열기
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowCreateWorkspace(true)}
                  style={{
                    ...secondaryButtonStyle,
                    marginTop: "16px",
                  }}
                >
                  새 워크스페이스 만들기
                </button>
              </section>
            )}

            {(workspaces.length === 0 || showCreateWorkspace) && (
              <section style={workspaces.length > 0 ? sectionStyle : undefined}>
                <h2 style={sectionTitleStyle}>새 워크스페이스 생성</h2>
                <p style={subTextStyle}>가족 또는 그룹 공간을 만들어보세요</p>

                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="예) 우리집"
                  style={inputStyle}
                />

                <textarea
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />

                <button
                  onClick={createWorkspace}
                  disabled={loading}
                  style={primaryButtonStyle(loading)}
                >
                  {loading ? "생성 중..." : "워크스페이스 만들기"}
                </button>

                {workspaces.length > 0 && (
                  <button
                    onClick={() => setShowCreateWorkspace(false)}
                    disabled={loading}
                    style={{
                      ...secondaryButtonStyle,
                      marginTop: "10px",
                    }}
                  >
                    기존 목록으로 돌아가기
                  </button>
                )}
              </section>
            )}
          </>
        ) : (
          <>
            <div style={workspaceBoxStyle}>
              <div style={labelStyle}>현재 워크스페이스</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {workspace.name}
              </div>
              {workspace.description && (
                <div style={{ marginTop: 4, color: "#64748b", fontSize: 14 }}>
                  {workspace.description}
                </div>
              )}

              <button
                onClick={goBackToWorkspaceList}
                disabled={loading}
                style={{
                  ...secondaryButtonStyle,
                  marginTop: "12px",
                }}
              >
                워크스페이스 목록으로
              </button>
            </div>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>1. 참여자 추가</h2>
              <p style={subTextStyle}>실명 대신 앱에서 부를 이름만 입력하세요</p>

              <input
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="예) 엄마, 첫째, 토끼"
                style={inputStyle}
              />

              <select
                value={memberRole}
                onChange={(e) =>
                  setMemberRole(e.target.value as "manager" | "member")
                }
                style={inputStyle}
              >
                <option value="manager">보호자/관리자</option>
                <option value="member">참여자/자녀</option>
              </select>

              <button
                onClick={addMember}
                disabled={loading}
                style={primaryButtonStyle(loading)}
              >
                {loading ? "추가 중..." : "참여자 추가"}
              </button>

              {members.length > 0 && (
                <div style={listStyle}>
                  {members.map((member) => (
                    <div key={member.id} style={memberCardStyle}>
                      <div>
                        <span style={{ fontWeight: 700 }}>
                          {member.display_name}
                        </span>
                        <div
                          style={{
                            marginTop: 4,
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          스티커 {balanceByMemberId(member.id)}개
                        </div>
                      </div>

                      <span style={badgeStyle(member.role)}>
                        {member.role === "manager" ? "보호자" : "참여자"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {members.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>2. 미션 만들기</h2>
                <p style={subTextStyle}>
                  참여자에게 오늘 할 미션을 부여하세요
                </p>

                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="예) 피아노 100번 치기"
                  style={inputStyle}
                />

                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />

                <select
                  value={taskAssignedMemberId}
                  onChange={(e) => setTaskAssignedMemberId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">미션 받을 참여자 선택</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>

                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="habit">습관</option>
                  <option value="study">학습</option>
                  <option value="chore">집안일</option>
                  <option value="health">건강</option>
                  <option value="promise">약속</option>
                  <option value="custom">기타</option>
                </select>

                <select
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="none">인증 없음</option>
                  <option value="text">텍스트 인증</option>
                  <option value="photo">사진 인증</option>
                  <option value="video">영상 인증</option>
                  <option value="audio">음성 인증</option>
                </select>

                <input
                  type="number"
                  min={0}
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(Number(e.target.value))}
                  placeholder="스티커 개수"
                  style={inputStyle}
                />

                <button
                  onClick={createTask}
                  disabled={loading}
                  style={primaryButtonStyle(loading)}
                >
                  {loading ? "생성 중..." : "미션 만들기"}
                </button>
              </section>
            )}

            {tasks.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>3. 오늘의 미션</h2>

                <div style={listStyle}>
                  {tasks.map((task) => (
                    <div key={task.id} style={taskCardStyle}>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>
                              {task.title}
                            </div>

                            <div
                              style={{
                                marginTop: 6,
                                color: "#64748b",
                                fontSize: 13,
                              }}
                            >
                              대상: {memberNameById(task.assigned_member_id)}
                            </div>

                            <div
                              style={{
                                marginTop: 4,
                                color: "#64748b",
                                fontSize: 13,
                              }}
                            >
                              인증: {verificationLabel(task.verification_type)} ·
                              스티커 {task.reward_points}개
                            </div>
                          </div>

                          <span style={taskStatusBadgeStyle(task.status)}>
                            {taskStatusLabel(task.status)}
                          </span>
                        </div>

                        {task.status === "todo" && (
                          <div style={{ marginTop: "14px" }}>
                            {activeSubmitTaskId === task.id ? (
                              <>
                                <textarea
                                  value={submissionText}
                                  onChange={(e) =>
                                    setSubmissionText(e.target.value)
                                  }
                                  placeholder={
                                    task.verification_type === "none"
                                      ? "완료 메모를 남겨보세요. 선택사항입니다."
                                      : "인증 내용을 입력하세요. 예) 오늘 30분 연습했어요."
                                  }
                                  rows={3}
                                  style={{
                                    ...inputStyle,
                                    marginBottom: "10px",
                                    resize: "vertical",
                                  }}
                                />

                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "8px",
                                  }}
                                >
                                  <button
                                    onClick={() => submitTask(task)}
                                    disabled={loading}
                                    style={primaryButtonStyle(loading)}
                                  >
                                    {loading ? "제출 중..." : "제출하기"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      setActiveSubmitTaskId(null);
                                      setSubmissionText("");
                                    }}
                                    disabled={loading}
                                    style={secondaryButtonStyle}
                                  >
                                    취소
                                  </button>
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveSubmitTaskId(task.id);
                                  setSubmissionText("");
                                }}
                                disabled={loading}
                                style={secondaryButtonStyle}
                              >
                                완료/인증 제출
                              </button>
                            )}
                          </div>
                        )}

                        {task.status === "submitted" && (
                          <div style={submittedActionBoxStyle}>
                            <div style={submittedTextStyle}>
                              인증 제출 완료 · 보호자 승인 대기
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "8px",
                                marginTop: "10px",
                              }}
                            >
                              <button
                                onClick={() => approveTask(task)}
                                disabled={loading}
                                style={approveButtonStyle(loading)}
                              >
                                승인
                              </button>

                              <button
                                onClick={() => rejectTask(task)}
                                disabled={loading}
                                style={rejectButtonStyle(loading)}
                              >
                                반려
                              </button>
                            </div>
                          </div>
                        )}

                        {task.status === "approved" && (
                          <div style={approvedBoxStyle}>
                            승인 완료 · 스티커 {task.reward_points}개 지급됨
                          </div>
                        )}

                        {task.status === "rejected" && (
                          <div style={rejectedBoxStyle}>
                            반려됨 · 다시 제출이 필요합니다
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {members.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>4. 보상 만들기</h2>
                <p style={subTextStyle}>
                  모은 스티커로 교환할 수 있는 보상을 등록하세요
                </p>

                <input
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="예) 게임 30분, 떡볶이 먹기"
                  style={inputStyle}
                />

                <textarea
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />

                <select
                  value={rewardTargetMemberId}
                  onChange={(e) => setRewardTargetMemberId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">보상 대상 참여자 선택</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={0}
                  value={rewardCostPoints}
                  onChange={(e) => setRewardCostPoints(Number(e.target.value))}
                  placeholder="필요 스티커 개수"
                  style={inputStyle}
                />

                <button
                  onClick={createReward}
                  disabled={loading}
                  style={primaryButtonStyle(loading)}
                >
                  {loading ? "생성 중..." : "보상 만들기"}
                </button>
              </section>
            )}

            {rewards.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>5. 보상 목록</h2>

                <div style={listStyle}>
                  {rewards.map((reward) => {
                    const balance = reward.target_member_id
                      ? balanceByMemberId(reward.target_member_id)
                      : 0;

                    const canRedeem =
                      reward.status !== "redeemed" &&
                      balance >= reward.cost_points;

                    return (
                      <div key={reward.id} style={rewardCardStyle}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 16 }}>
                            {reward.title}
                          </div>
                          {reward.description && (
                            <div
                              style={{
                                marginTop: 4,
                                color: "#64748b",
                                fontSize: 13,
                              }}
                            >
                              {reward.description}
                            </div>
                          )}

                          <div
                            style={{
                              marginTop: 8,
                              color: "#64748b",
                              fontSize: 13,
                            }}
                          >
                            대상: {memberNameById(reward.target_member_id)} · 필요
                            스티커 {reward.cost_points}개 · 현재 {balance}개
                          </div>
                        </div>

                        {reward.status === "redeemed" ? (
                          <div style={redeemedBoxStyle}>교환 완료</div>
                        ) : (
                          <button
                            onClick={() => redeemReward(reward)}
                            disabled={loading || !canRedeem}
                            style={
                              canRedeem
                                ? rewardButtonStyle
                                : disabledRewardButtonStyle
                            }
                          >
                            교환하기
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}

        {message && <div style={messageBoxStyle(message)}>{message}</div>}
      </div>
    </main>
  );
}

function verificationLabel(type: string) {
  if (type === "text") return "텍스트";
  if (type === "photo") return "사진";
  if (type === "video") return "영상";
  if (type === "audio") return "음성";
  if (type === "location") return "위치";
  return "없음";
}

function taskStatusLabel(status: string) {
  if (status === "todo") return "대기";
  if (status === "submitted") return "제출됨";
  if (status === "approved") return "승인됨";
  if (status === "rejected") return "반려됨";
  return status;
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const containerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  background: "#fff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const titleStyle: CSSProperties = {
  marginBottom: "8px",
  fontSize: "28px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: "22px",
};

const subTextStyle: CSSProperties = {
  color: "#64748b",
  marginBottom: "20px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #dbeafe",
  marginBottom: "12px",
  outline: "none",
};

const workspaceBoxStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#eef2ff",
  marginBottom: "22px",
};

const labelStyle: CSSProperties = {
  color: "#4f46e5",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "4px",
};

const sectionStyle: CSSProperties = {
  paddingTop: "22px",
  marginTop: "22px",
  borderTop: "1px solid #e2e8f0",
};

const listStyle: CSSProperties = {
  marginTop: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const workspaceSelectButtonStyle: CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
};

const memberCardStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

function badgeStyle(role: string): CSSProperties {
  return {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: role === "manager" ? "#dbeafe" : "#dcfce7",
    color: role === "manager" ? "#1d4ed8" : "#15803d",
  };
}

const taskCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const rewardCardStyle: CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

function taskStatusBadgeStyle(status: string): CSSProperties {
  const isTodo = status === "todo";
  const isSubmitted = status === "submitted";
  const isApproved = status === "approved";

  return {
    height: "fit-content",
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: isApproved
      ? "#dcfce7"
      : isSubmitted
      ? "#dbeafe"
      : isTodo
      ? "#fef3c7"
      : "#fee2e2",
    color: isApproved
      ? "#15803d"
      : isSubmitted
      ? "#1d4ed8"
      : isTodo
      ? "#92400e"
      : "#b91c1c",
    fontWeight: 700,
    whiteSpace: "nowrap",
  };
}

function primaryButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: loading ? "#94a3b8" : "#4f46e5",
    color: "white",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
  };
}

const secondaryButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#4338ca",
  fontWeight: "bold",
  cursor: "pointer",
};

const submittedActionBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "12px",
  background: "#eff6ff",
};

const submittedTextStyle: CSSProperties = {
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: 700,
};

function approveButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: loading ? "#94a3b8" : "#16a34a",
    color: "white",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
  };
}

function rejectButtonStyle(loading: boolean): CSSProperties {
  return {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #fecaca",
    background: loading ? "#fca5a5" : "#fef2f2",
    color: "#b91c1c",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
  };
}

const approvedBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "12px",
  background: "#ecfdf5",
  color: "#047857",
  fontSize: "13px",
  fontWeight: 700,
};

const rejectedBoxStyle: CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "12px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "13px",
  fontWeight: 700,
};

const rewardButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "none",
  background: "#f97316",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const disabledRewardButtonStyle: CSSProperties = {
  width: "100%",
  padding: "13px",
  borderRadius: "12px",
  border: "none",
  background: "#cbd5e1",
  color: "#64748b",
  fontWeight: "bold",
  cursor: "not-allowed",
};

const redeemedBoxStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "#ecfdf5",
  color: "#047857",
  fontSize: "13px",
  fontWeight: 800,
  textAlign: "center",
};

function messageBoxStyle(message: string): CSSProperties {
  const ok =
    message.includes("완료") ||
    message.includes("생성") ||
    message.includes("추가") ||
    message.includes("제출") ||
    message.includes("승인") ||
    message.includes("교환") ||
    message.includes("불러왔습니다");

  return {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    background: ok ? "#ecfdf5" : "#fef2f2",
    color: ok ? "#047857" : "#b91c1c",
    fontSize: "14px",
    lineHeight: 1.5,
  };
}
