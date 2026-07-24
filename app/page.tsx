"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";

import AuthPanel from "@/components/AuthPanel";
import BottomNav from "@/components/BottomNav";
import WorkspaceSwitcher from "@/components/WorkspaceSwitcher";
import CreateWorkspaceCard from "@/components/CreateWorkspaceCard";
import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";

import CalendarGrid from "@/features/calendar/CalendarGrid";
import CalendarToolbar from "@/features/calendar/CalendarToolbar";
import DayTaskList from "@/features/calendar/DayTaskList";
import MissionTab from "@/features/missions/MissionTab";
import RewardTab from "@/features/rewards/RewardTab";
import SettingsTab from "@/features/settings/SettingsTab";
import SummaryStrip from "@/features/calendar/SummaryStrip";

import { addMonths, endOfMonth, startOfMonth, toDateKey } from "@/lib/date";
import { tabTitle } from "@/lib/labels";

import type {
  ActiveTab,
  Member,
  Profile,
  Reward,
  RewardTransaction,
  Task,
  Workspace,
} from "@/types/app";

const memberSelect = "id, profile_id, display_name, role, is_virtual";
const taskSelect =
  "id, workspace_id, title, description, status, due_date, assigned_member_id, verification_type, reward_points";
const rewardSelect =
  "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status";
const rewardTxSelect =
  "id, member_id, amount, transaction_type, source_type, source_id";

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignedMemberId, setNewTaskAssignedMemberId] = useState("");
  const [newTaskVerificationType, setNewTaskVerificationType] = useState("none");
  const [newTaskRewardPoints, setNewTaskRewardPoints] = useState(1);

  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardTargetMemberId, setNewRewardTargetMemberId] = useState("");
  const [newRewardCostPoints, setNewRewardCostPoints] = useState(1);

  useEffect(() => {
    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        resetState();
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      const loadedProfile = await loadProfile(session.user.id);
      if (loadedProfile) await loadWorkspaces(loadedProfile.id);
      setAuthLoading(false);
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workspace?.id) loadWorkspaceData(workspace.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, currentMonth.getFullYear(), currentMonth.getMonth()]);

  const selectedTasks = useMemo(() => {
    return tasks.filter((task) => task.due_date === selectedDate);
  }, [tasks, selectedDate]);

  const monthTaskCount = tasks.length;
  const pendingCount = tasks.filter((task) => task.status === "submitted").length;
  const approvedCount = tasks.filter((task) => task.status === "approved").length;

  async function initializeAuth() {
    setAuthLoading(true);

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    const loadedProfile = await loadProfile(data.user.id);
    if (loadedProfile) await loadWorkspaces(loadedProfile.id);
    setAuthLoading(false);
  }

  async function loadProfile(authUserId: string): Promise<Profile | null> {
    const { data: userData } = await supabase.auth.getUser();
    const fallbackName = userData.user?.email?.split("@")[0] || "사용자";

    const { data, error } = await supabase
      .from("profiles")
      .select("id, auth_user_id, display_name, avatar_url, onboarding_completed")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      setMessage(`프로필 불러오기 실패: ${error.message}`);
      return null;
    }

    if (data) {
      const loaded = {
        ...(data as Profile),
        display_name: data.display_name || fallbackName,
      };
      setProfile(loaded);
      return loaded;
    }

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({
        auth_user_id: authUserId,
        display_name: fallbackName,
        onboarding_completed: false,
      })
      .select("id, auth_user_id, display_name, avatar_url, onboarding_completed")
      .single();

    if (createError) {
      setMessage(`프로필 생성 실패: ${createError.message}`);
      return null;
    }

    const createdProfile = created as Profile;
    setProfile(createdProfile);
    return createdProfile;
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
      options: { data: { display_name: authEmail.split("@")[0] } },
    });

    setMessage(
      error
        ? `회원가입 실패: ${error.message}`
        : "회원가입 완료. 인증 메일 확인 후 로그인해주세요."
    );
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

    const loadedProfile = await loadProfile(data.user.id);
    if (loadedProfile) {
      await loadWorkspaces(loadedProfile.id);
      setMessage("로그인 성공");
    }
    setLoading(false);
  }

  async function signOut() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signOut({ scope: "global" });

    if (error) {
      setMessage(`로그아웃 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined") {
      Object.keys(window.localStorage).forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.includes("auth-token")
        ) {
          window.localStorage.removeItem(key);
        }
      });
    }

    resetState();
    setProfile(null);
    setAuthEmail("");
    setAuthPassword("");
    setAuthMode("signin");
    setLoading(false);
    setMessage("로그아웃 완료");
  }

  function resetState() {
    setWorkspaces([]);
    setWorkspace(null);
    setMembers([]);
    setTasks([]);
    setRewards([]);
    setRewardTransactions([]);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskAssignedMemberId("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setNewRewardTitle("");
    setNewRewardDescription("");
    setNewRewardTargetMemberId("");
    setNewRewardCostPoints(1);
  }

  async function loadWorkspaces(profileId: string) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, description")
      .eq("created_by", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`워크스페이스 불러오기 실패: ${error.message}`);
      return;
    }

    const list = (data || []) as Workspace[];
    setWorkspaces(list);

    if (list.length > 0) {
      setWorkspace((current) => current || list[0]);
    }
  }

  async function createWorkspace() {
    if (!profile) {
      setMessage("로그인이 필요합니다.");
      return;
    }

    if (!workspaceName.trim()) {
      setMessage("워크스페이스 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: createdWorkspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || null,
        created_by: profile.id,
      })
      .select("id, name, description")
      .single();

    if (workspaceError) {
      setMessage(`워크스페이스 생성 실패: ${workspaceError.message}`);
      setLoading(false);
      return;
    }

    const { error: ownerError } = await supabase.from("workspace_members").insert({
      workspace_id: createdWorkspace.id,
      profile_id: profile.id,
      display_name: profile.display_name || "사용자",
      role: "owner",
      status: "active",
      is_virtual: false,
      created_by: profile.id,
      joined_at: new Date().toISOString(),
    });

    if (ownerError) {
      setMessage(`owner 등록 실패: ${ownerError.message}`);
      setLoading(false);
      return;
    }

    const newWorkspace = createdWorkspace as Workspace;
    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setWorkspace(newWorkspace);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setMessage(`워크스페이스 생성 완료: ${newWorkspace.name}`);
    setLoading(false);
  }

  async function loadWorkspaceData(workspaceId: string) {
    const monthStart = toDateKey(startOfMonth(currentMonth));
    const monthEnd = toDateKey(endOfMonth(currentMonth));

    const [membersResult, tasksResult, rewardsResult, rewardTransactionsResult] =
      await Promise.all([
        supabase
          .from("workspace_members")
          .select(memberSelect)
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true }),
        supabase
          .from("tasks")
          .select(taskSelect)
          .eq("workspace_id", workspaceId)
          .gte("due_date", monthStart)
          .lte("due_date", monthEnd)
          .order("due_date", { ascending: true }),
        supabase
          .from("rewards")
          .select(rewardSelect)
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reward_transactions")
          .select(rewardTxSelect)
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true }),
      ]);

    if (membersResult.error) {
      setMessage(`참여자 불러오기 실패: ${membersResult.error.message}`);
      return;
    }

    if (tasksResult.error) {
      setMessage(`미션 불러오기 실패: ${tasksResult.error.message}`);
      return;
    }

    if (rewardsResult.error) {
      setMessage(`보상 불러오기 실패: ${rewardsResult.error.message}`);
      return;
    }

    if (rewardTransactionsResult.error) {
      setMessage(`스티커 내역 불러오기 실패: ${rewardTransactionsResult.error.message}`);
      return;
    }

    setMembers((membersResult.data || []) as Member[]);
    setTasks((tasksResult.data || []) as Task[]);
    setRewards((rewardsResult.data || []) as Reward[]);
    setRewardTransactions((rewardTransactionsResult.data || []) as RewardTransaction[]);
  }

  async function createTask() {
    if (!workspace) {
      setMessage("워크스페이스를 먼저 선택해주세요.");
      return;
    }

    if (!newTaskTitle.trim()) {
      setMessage("미션 제목을 입력해주세요.");
      return;
    }

    if (!newTaskAssignedMemberId) {
      setMessage("미션을 받을 참여자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const creatorMemberId =
      members.find((member) => member.role === "owner" || member.role === "manager")?.id ||
      null;

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
        verification_required: newTaskVerificationType !== "none",
        reward_points: newTaskRewardPoints,
        rollover_enabled: true,
        created_by_member_id: creatorMemberId,
      })
      .select(taskSelect)
      .single();

    if (error) {
      setMessage(`미션 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => [...prev, data as Task]);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setMessage("미션 생성 완료");
    setLoading(false);
  }

  async function createReward() {
    if (!workspace) {
      setMessage("워크스페이스를 먼저 선택해주세요.");
      return;
    }

    if (!newRewardTitle.trim()) {
      setMessage("보상 이름을 입력해주세요.");
      return;
    }

    if (!newRewardTargetMemberId) {
      setMessage("보상 대상 참여자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager =
      members.find((member) => member.role === "owner" || member.role === "manager") || null;

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
      setMessage(`보상 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => [data as Reward, ...prev]);
    setNewRewardTitle("");
    setNewRewardDescription("");
    setNewRewardCostPoints(1);
    setMessage("보상 생성 완료");
    setLoading(false);
  }

  async function redeemReward(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스를 먼저 선택해주세요.");
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
      setMessage(`스티커가 부족합니다. 필요 ${reward.cost_points}개 / 현재 ${balance}개`);
      return;
    }

    setLoading(true);
    setMessage("");

    const manager =
      members.find((member) => member.role === "owner" || member.role === "manager") || null;

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
      .select(rewardTxSelect)
      .single();

    if (spendError) {
      setMessage(`스티커 차감 실패: ${spendError.message}`);
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
    setRewards((prev) =>
      prev.map((item) => (item.id === reward.id ? (updatedReward as Reward) : item))
    );
    setMessage(`보상 교환 완료: ${reward.title}`);
    setLoading(false);
  }

  function balanceByMemberId(memberId: string) {
    return rewardTransactions
      .filter((item) => item.member_id === memberId)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  if (authLoading) {
    return (
      <Shell>
        <h1 style={titleStyle}>미루지말자</h1>
        <p style={subTextStyle}>로그인 상태를 확인하는 중입니다...</p>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <AuthPanel
          mode={authMode}
          email={authEmail}
          password={authPassword}
          loading={loading}
          message={message}
          onModeChange={setAuthMode}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onSignIn={signIn}
          onSignUp={signUp}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <main style={pageStyle}>
        <div style={phoneStyle}>
          <AppHeader
            title={tabTitle(activeTab)}
            loading={loading}
            onSignOut={signOut}
          />
  
          <section style={accountBoxStyle}>
            <div>
              <div style={smallLabelStyle}>로그인 중</div>
              <strong>{profile.display_name}</strong>
            </div>
            <a href="/dev" style={devLinkStyle}>
              개발화면
            </a>
          </section>
  
          {workspaces.length > 0 ? (
            <WorkspaceSwitcher
              workspaces={workspaces}
              currentWorkspaceId={workspace?.id ?? ""}
              onSelect={(id) => {
                const next = workspaces.find((item) => item.id === id) || null;
                setWorkspace(next);
              }}
            />
          ) : (
            <CreateWorkspaceCard
              name={workspaceName}
              description={workspaceDescription}
              loading={loading}
              onNameChange={setWorkspaceName}
              onDescriptionChange={setWorkspaceDescription}
              onCreate={createWorkspace}
            />
          )}
  
          {workspace && activeTab === "calendar" && (
            <>
              <SummaryStrip
                monthTaskCount={monthTaskCount}
                pendingCount={pendingCount}
                approvedCount={approvedCount}
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
              <CalendarGrid
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                tasks={tasks}
                onSelectDate={setSelectedDate}
              />
              <DayTaskList selectedDate={selectedDate} tasks={selectedTasks} members={members} />
            </>
          )}
  
          {workspace && activeTab === "missions" && (
            <MissionTab
              selectedDate={selectedDate}
              members={members}
              tasks={selectedTasks}
              title={newTaskTitle}
              description={newTaskDescription}
              assignedMemberId={newTaskAssignedMemberId}
              verificationType={newTaskVerificationType}
              rewardPoints={newTaskRewardPoints}
              loading={loading}
              onTitleChange={setNewTaskTitle}
              onDescriptionChange={setNewTaskDescription}
              onAssignedMemberIdChange={setNewTaskAssignedMemberId}
              onVerificationTypeChange={setNewTaskVerificationType}
              onRewardPointsChange={setNewTaskRewardPoints}
              onCreate={createTask}
            />
          )}
  
          {workspace && activeTab === "rewards" && (
            <RewardTab
              members={members}
              rewards={rewards}
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
              onRedeem={redeemReward}
            />
          )}
  
          {workspace && activeTab === "settings" && (
            <SettingsTab
              workspaces={workspaces}
              workspace={workspace}
              members={members}
              workspaceName={workspaceName}
              workspaceDescription={workspaceDescription}
              loading={loading}
              onWorkspaceNameChange={setWorkspaceName}
              onWorkspaceDescriptionChange={setWorkspaceDescription}
              onCreateWorkspace={createWorkspace}
            />
          )}
  
          {message && <div style={messageBoxStyle(message)}>{message}</div>}
          <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </main>
    </Shell>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#e2f3f1",
  padding: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const phoneStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "calc(100vh - 32px)",
  background: "#fff",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
};

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const eyebrowStyle: CSSProperties = {
  color: "#4f46e5",
  fontSize: 13,
  fontWeight: 800,
};

const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  letterSpacing: "-0.04em",
};

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 30,
  letterSpacing: "-0.04em",
};

const subTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 20,
};

const logoutButtonStyle: CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 14,
  padding: "10px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

const accountBoxStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  borderRadius: 18,
  padding: 14,
  marginBottom: 16,
};

const smallLabelStyle: CSSProperties = {
  display: "block",
  color: "#047857",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 4,
};

const devLinkStyle: CSSProperties = {
  color: "#4f46e5",
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
};

const messageBoxStyle = (message: string): CSSProperties => {
  const ok =
    message.includes("완료") ||
    message.includes("성공") ||
    message.includes("불러오기") ||
    message.includes("교환");

  return {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: ok ? "#ecfdf5" : "#fef2f2",
    color: ok ? "#047857" : "#b91c1c",
    fontSize: 14,
    lineHeight: 1.5,
  };
};
