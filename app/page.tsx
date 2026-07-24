
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";

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
import SettingsTab from "@/features/settings/SettingsTab";

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

type MemberRole = "manager" | "member";

type InviteAcceptResult = {
  workspace_id?: string;
  member_id?: string;
  status?: string;
};

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

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>("member");
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [joinInviteCode, setJoinInviteCode] = useState("");

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
      if (loadedProfile) await loadWorkspaces();
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
  
  const currentMember = useMemo(() => {
    if (!profile) return null;
  
    return (
      members.find((member) => member.profile_id === profile.id) || null
    );
  }, [members, profile]);
  
  const isManager =
    currentMember?.role === "owner" || currentMember?.role === "manager";
  
  const isMember = currentMember?.role === "member";
  
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
    if (loadedProfile) await loadWorkspaces();
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
      await loadWorkspaces();
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
    setNewMemberName("");
    setNewMemberRole("member");
    setInviteCodes({});
    setJoinInviteCode("");
  }

  async function loadWorkspaces() {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, description")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`워크스페이스 불러오기 실패: ${error.message}`);
      return;
    }

    const list = (data || []) as Workspace[];
    setWorkspaces(list);
    setWorkspace((current) => {
      if (current && list.some((item) => item.id === current.id)) return current;
      return list[0] || null;
    });
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
    setActiveTab("settings");
    setMessage(`워크스페이스 생성 완료: ${newWorkspace.name}`);
    setLoading(false);
  }

  async function addMember() {
    if (!workspace) {
      setMessage("워크스페이스를 먼저 선택해주세요.");
      return;
    }

    if (!newMemberName.trim()) {
      setMessage("참여자 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        display_name: newMemberName.trim(),
        role: newMemberRole,
        status: "active",
        is_virtual: true,
        created_by: profile?.id || null,
      })
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`참여자 추가 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => [...prev, data as Member]);
    setNewMemberName("");
    setNewMemberRole("member");
    setMessage(`참여자 추가 완료: ${data.display_name}`);
    setLoading(false);
  }

  function makeInviteCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function createInviteForMember(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스를 먼저 선택해주세요.");
      return;
    }

    if (!member.is_virtual) {
      setMessage("이미 계정과 연결된 참여자입니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager = members.find(
      (item) => item.role === "owner" || item.role === "manager"
    );
    const inviteCode = makeInviteCode();

    const { error } = await supabase.from("workspace_invites").insert({
      workspace_id: workspace.id,
      target_member_id: member.id,
      invite_code: inviteCode,
      role: member.role,
      status: "pending",
      created_by_member_id: manager?.id || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      setMessage(`초대코드 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setInviteCodes((prev) => ({
      ...prev,
      [member.id]: inviteCode,
    }));
    setMessage(`초대코드 생성 완료: ${inviteCode}`);
    setLoading(false);
  }

  async function acceptInviteCode() {
    if (!joinInviteCode.trim()) {
      setMessage("초대코드를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("accept_workspace_invite", {
      input_code: joinInviteCode.trim().toUpperCase(),
    });

    if (error) {
      setMessage(`초대코드 참여 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setJoinInviteCode("");
    setMessage("워크스페이스 참여 완료");

    const result = data as InviteAcceptResult | null;
    const joinedWorkspaceId = result?.workspace_id;

    await loadWorkspaces();

    if (joinedWorkspaceId) {
      const { data: joinedWorkspace } = await supabase
        .from("workspaces")
        .select("id, name, description")
        .eq("id", joinedWorkspaceId)
        .single();

      if (joinedWorkspace) setWorkspace(joinedWorkspace as Workspace);
    }

    setActiveTab("calendar");
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
      <AppHeader title={tabTitle(activeTab)} loading={loading} onSignOut={signOut} />

      <section style={accountBoxStyle}>
        <div>
          <div style={smallLabelStyle}>로그인 중</div>
          <strong>{profile.display_name}</strong>
        </div>
        <a href="/dev" style={devLinkStyle}>
          개발화면
        </a>
      </section>

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
          currentMember={currentMember}
          isManager={isManager}
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
          currentMember={currentMember}
          isManager={isManager}
        />
      )}

      {activeTab === "settings" && (
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
          newMemberName={newMemberName}
          newMemberRole={newMemberRole}
          onNewMemberNameChange={setNewMemberName}
          onNewMemberRoleChange={setNewMemberRole}
          onAddMember={addMember}
          inviteCodes={inviteCodes}
          onCreateInvite={createInviteForMember}
          joinInviteCode={joinInviteCode}
          onJoinInviteCodeChange={setJoinInviteCode}
          onAcceptInvite={acceptInviteCode}
          currentMember={currentMember}
          isManager={isManager}
        />
      )}

      {!workspace && activeTab !== "settings" && (
        <NoWorkspacePrompt onGoSettings={() => setActiveTab("settings")} />
      )}

      {message && <div style={messageBoxStyle(message)}>{message}</div>}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </Shell>
  );
}

function NoWorkspacePrompt({ onGoSettings }: { onGoSettings: () => void }) {
  return (
    <section style={emptyWorkspaceBoxStyle}>
      <h2 style={emptyWorkspaceTitleStyle}>워크스페이스가 필요합니다</h2>
      <p style={emptyWorkspaceTextStyle}>
        캘린더, 미션, 보상 기능을 사용하려면 먼저 워크스페이스에 참여하거나 새 워크스페이스를 만들어야 합니다.
      </p>
      <button onClick={onGoSettings} style={emptyWorkspaceButtonStyle}>
        설정에서 시작하기
      </button>
    </section>
  );
}

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

const emptyWorkspaceBoxStyle: CSSProperties = {
  padding: 18,
  borderRadius: 20,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginTop: 18,
};

const emptyWorkspaceTitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 20,
  fontWeight: 900,
};

const emptyWorkspaceTextStyle: CSSProperties = {
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 14,
};

const emptyWorkspaceButtonStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "#4f46e5",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
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
