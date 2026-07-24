"use client";

import { useEffect, useMemo, useState } from "react";
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
  profile_id: string | null;
  display_name: string;
  role: "owner" | "manager" | "member";
  is_virtual: boolean;
};

type Task = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_member_id: string | null;
  verification_type: string;
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

type ActiveTab = "calendar" | "missions" | "rewards" | "settings";

const memberSelect = "id, profile_id, display_name, role, is_virtual";
const taskSelect = "id, workspace_id, title, description, status, due_date, assigned_member_id, verification_type, reward_points";
const rewardSelect = "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status";
const rewardTxSelect = "id, member_id, amount, transaction_type, source_type, source_id";

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

  const selectedTasks = useMemo(() => tasks.filter((task) => task.due_date === selectedDate), [tasks, selectedDate]);
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
      const loaded = { ...(data as Profile), display_name: data.display_name || fallbackName };
      setProfile(loaded);
      return loaded;
    }

    const { data: created, error: createError } = await supabase
      .from("profiles")
      .insert({ auth_user_id: authUserId, display_name: fallbackName, onboarding_completed: false })
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

    setMessage(error ? `회원가입 실패: ${error.message}` : "회원가입 완료. 인증 메일 확인 후 로그인해주세요.");
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
        if (key.startsWith("sb-") || key.includes("supabase") || key.includes("auth-token")) {
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

    if (list.length > 0) setWorkspace((current) => current || list[0]);
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
      .insert({ name: workspaceName.trim(), description: workspaceDescription.trim() || null, created_by: profile.id })
      .select("id, name, description")
      .single();

    if (workspaceError) {
      setMessage(`워크스페이스 생성 실패: ${workspaceError.message}`);
      setLoading(false);
      return;
    }

    const { error: ownerError } = await supabase
      .from("workspace_members")
      .insert({
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

    const [membersResult, tasksResult, rewardsResult, rewardTransactionsResult] = await Promise.all([
      supabase.from("workspace_members").select(memberSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
      supabase.from("tasks").select(taskSelect).eq("workspace_id", workspaceId).gte("due_date", monthStart).lte("due_date", monthEnd).order("due_date", { ascending: true }),
      supabase.from("rewards").select(rewardSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
      supabase.from("reward_transactions").select(rewardTxSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
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

    const creatorMemberId = members.find((member) => member.role === "owner" || member.role === "manager")?.id || null;

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

    const manager = members.find((member) => member.role === "owner" || member.role === "manager") || null;

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

    const manager = members.find((member) => member.role === "owner" || member.role === "manager") || null;

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
    setRewards((prev) => prev.map((item) => item.id === reward.id ? (updatedReward as Reward) : item));
    setMessage(`보상 교환 완료: ${reward.title}`);
    setLoading(false);
  }

  function balanceByMemberId(memberId: string) {
    return rewardTransactions
      .filter((item) => item.member_id === memberId)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  if (authLoading) {
    return <Shell><h1 style={titleStyle}>미루지말자</h1><p style={subTextStyle}>로그인 상태를 확인하는 중입니다...</p></Shell>;
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
    <main style={pageStyle}>
      <div style={phoneStyle}>
        <header style={topBarStyle}>
          <div><div style={eyebrowStyle}>미루지말자</div><h1 style={headerTitleStyle}>{tabTitle(activeTab)}</h1></div>
          <button onClick={signOut} disabled={loading} style={logoutButtonStyle}>로그아웃</button>
        </header>

        <section style={accountBoxStyle}>
          <div><div style={smallLabelStyle}>로그인 중</div><strong>{profile.display_name}</strong></div>
          <a href="/dev" style={devLinkStyle}>개발화면</a>
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
            <SummaryStrip monthTaskCount={monthTaskCount} pendingCount={pendingCount} approvedCount={approvedCount} />
            <CalendarToolbar currentMonth={currentMonth} onPrev={() => setCurrentMonth(addMonths(currentMonth, -1))} onNext={() => setCurrentMonth(addMonths(currentMonth, 1))} onToday={() => { const today = new Date(); setCurrentMonth(startOfMonth(today)); setSelectedDate(toDateKey(today)); }} />
            <CalendarGrid currentMonth={currentMonth} selectedDate={selectedDate} tasks={tasks} onSelectDate={setSelectedDate} />
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

        {workspace && activeTab === "settings" && <SettingsTab workspaces={workspaces} workspace={workspace} members={members} />}

        {message && <div style={messageBoxStyle(message)}>{message}</div>}
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main style={pageStyle}><div style={phoneStyle}>{children}</div></main>;
}

function AuthPanel({ mode, email, password, loading, message, onModeChange, onEmailChange, onPasswordChange, onSignIn, onSignUp }: { mode: "signin" | "signup"; email: string; password: string; loading: boolean; message: string; onModeChange: (mode: "signin" | "signup") => void; onEmailChange: (value: string) => void; onPasswordChange: (value: string) => void; onSignIn: () => void; onSignUp: () => void; }) {
  return <><h1 style={titleStyle}>미루지말자</h1><p style={subTextStyle}>부모와 자녀가 함께 쓰는 미션형 클라우드 다이어리</p><div style={tabGridStyle}><button onClick={() => onModeChange("signin")} style={mode === "signin" ? primaryButtonStyle(false) : secondaryButtonStyle}>로그인</button><button onClick={() => onModeChange("signup")} style={mode === "signup" ? primaryButtonStyle(false) : secondaryButtonStyle}>회원가입</button></div><input value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="이메일" style={inputStyle} /><input value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="비밀번호" type="password" style={inputStyle} />{mode === "signin" ? <button onClick={onSignIn} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "로그인 중..." : "로그인"}</button> : <button onClick={onSignUp} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "가입 중..." : "회원가입"}</button>}{message && <div style={messageBoxStyle(message)}>{message}</div>}</>;
}

function WorkspaceSwitcher({ workspaces, currentWorkspaceId, onSelect }: { workspaces: Workspace[]; currentWorkspaceId: string; onSelect: (id: string) => void; }) {
  return <section style={workspaceSwitcherStyle}><label style={smallLabelStyle}>워크스페이스</label><select value={currentWorkspaceId} onChange={(event) => onSelect(event.target.value)} style={selectStyle}>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></section>;
}

function CreateWorkspaceCard({ name, description, loading, compact, onNameChange, onDescriptionChange, onCreate }: { name: string; description: string; loading: boolean; compact?: boolean; onNameChange: (value: string) => void; onDescriptionChange: (value: string) => void; onCreate: () => void; }) {
  return <section style={compact ? compactCreateBoxStyle : createBoxStyle}>{!compact && <h2 style={sectionTitleStyle}>첫 워크스페이스 만들기</h2>}<input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="예) 우리집" style={inputStyle} /><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} /><button onClick={onCreate} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "생성 중..." : "워크스페이스 만들기"}</button></section>;
}

function SummaryStrip({ monthTaskCount, pendingCount, approvedCount }: { monthTaskCount: number; pendingCount: number; approvedCount: number; }) {
  return <section style={summaryGridStyle}><div style={summaryCardStyle}><div style={summaryNumberStyle}>{monthTaskCount}</div><div style={summaryLabelStyle}>이번 달 미션</div></div><div style={summaryCardStyle}><div style={summaryNumberStyle}>{pendingCount}</div><div style={summaryLabelStyle}>승인 대기</div></div><div style={summaryCardStyle}><div style={summaryNumberStyle}>{approvedCount}</div><div style={summaryLabelStyle}>승인 완료</div></div></section>;
}

function CalendarToolbar({ currentMonth, onPrev, onNext, onToday }: { currentMonth: Date; onPrev: () => void; onNext: () => void; onToday: () => void; }) {
  return <section style={calendarToolbarStyle}><button onClick={onPrev} style={monthButtonStyle}>‹</button><div style={monthTitleStyle}>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</div><button onClick={onNext} style={monthButtonStyle}>›</button><button onClick={onToday} style={todayButtonStyle}>오늘</button></section>;
}

function CalendarGrid({ currentMonth, selectedDate, tasks, onSelectDate }: { currentMonth: Date; selectedDate: string; tasks: Task[]; onSelectDate: (date: string) => void; }) {
  const days = buildCalendarDays(currentMonth);
  return <section style={calendarBoxStyle}><div style={weekHeaderGridStyle}>{["일", "월", "화", "수", "목", "금", "토"].map((day) => <div key={day} style={weekHeaderStyle}>{day}</div>)}</div><div style={calendarGridStyle}>{days.map((day) => { const dateKey = toDateKey(day); const isCurrentMonth = day.getMonth() === currentMonth.getMonth(); const isSelected = dateKey === selectedDate; const dayTasks = tasks.filter((task) => task.due_date === dateKey); const approved = dayTasks.filter((task) => task.status === "approved").length; const pending = dayTasks.filter((task) => task.status === "submitted").length; return <button key={dateKey} onClick={() => onSelectDate(dateKey)} style={{ ...calendarDayStyle, opacity: isCurrentMonth ? 1 : 0.35, borderColor: isSelected ? "#4f46e5" : "#e2e8f0", background: isSelected ? "#eef2ff" : "#fff" }}><div style={dayNumberStyle}>{day.getDate()}</div>{dayTasks.length > 0 && <div style={dayMetaStyle}><span>{dayTasks.length}</span>{pending > 0 && <span style={pendingDotStyle} />}{approved > 0 && <span style={approvedDotStyle} />}</div>}</button>; })}</div></section>;
}

function DayTaskList({ selectedDate, tasks, members }: { selectedDate: string; tasks: Task[]; members: Member[]; }) {
  return <section style={dayTaskSectionStyle}><h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션</h2>{tasks.length === 0 ? <div style={emptyStateStyle}>이 날짜에 등록된 미션이 없습니다.</div> : <TaskList tasks={tasks} members={members} />}</section>;
}

function MissionTab({ selectedDate, members, tasks, title, description, assignedMemberId, verificationType, rewardPoints, loading, onTitleChange, onDescriptionChange, onAssignedMemberIdChange, onVerificationTypeChange, onRewardPointsChange, onCreate }: { selectedDate: string; members: Member[]; tasks: Task[]; title: string; description: string; assignedMemberId: string; verificationType: string; rewardPoints: number; loading: boolean; onTitleChange: (value: string) => void; onDescriptionChange: (value: string) => void; onAssignedMemberIdChange: (value: string) => void; onVerificationTypeChange: (value: string) => void; onRewardPointsChange: (value: number) => void; onCreate: () => void; }) {
  return <><section style={createBoxStyle}><h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션 추가</h2><input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="예) 피아노 100번 치기" style={inputStyle} /><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} /><select value={assignedMemberId} onChange={(event) => onAssignedMemberIdChange(event.target.value)} style={inputStyle}><option value="">미션 받을 참여자 선택</option>{members.map((member) => <option key={member.id} value={member.id}>{member.display_name}</option>)}</select><select value={verificationType} onChange={(event) => onVerificationTypeChange(event.target.value)} style={inputStyle}><option value="none">인증 없음</option><option value="text">텍스트 인증</option><option value="photo">사진 인증</option><option value="video">영상 인증</option><option value="audio">음성 인증</option></select><input type="number" min={0} value={rewardPoints} onChange={(event) => onRewardPointsChange(Number(event.target.value))} placeholder="스티커 개수" style={inputStyle} /><button onClick={onCreate} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "생성 중..." : "미션 만들기"}</button></section><section style={dayTaskSectionStyle}><h2 style={sectionTitleStyle}>{formatKoreanDate(selectedDate)} 미션 목록</h2>{tasks.length === 0 ? <div style={emptyStateStyle}>이 날짜에 등록된 미션이 없습니다.</div> : <TaskList tasks={tasks} members={members} />}</section></>;
}

function RewardTab({ members, rewards, title, description, targetMemberId, costPoints, loading, balanceByMemberId, onTitleChange, onDescriptionChange, onTargetMemberIdChange, onCostPointsChange, onCreate, onRedeem }: { members: Member[]; rewards: Reward[]; title: string; description: string; targetMemberId: string; costPoints: number; loading: boolean; balanceByMemberId: (memberId: string) => number; onTitleChange: (value: string) => void; onDescriptionChange: (value: string) => void; onTargetMemberIdChange: (value: string) => void; onCostPointsChange: (value: number) => void; onCreate: () => void; onRedeem: (reward: Reward) => void; }) {
  return <><section style={createBoxStyle}><h2 style={sectionTitleStyle}>보상 만들기</h2><p style={subTextStyle}>모은 스티커로 교환할 수 있는 보상을 등록하세요.</p><input value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="예) 게임 30분, 떡볶이 먹기" style={inputStyle} /><textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="설명 (선택)" rows={3} style={{ ...inputStyle, resize: "vertical" }} /><select value={targetMemberId} onChange={(event) => onTargetMemberIdChange(event.target.value)} style={inputStyle}><option value="">보상 대상 참여자 선택</option>{members.map((member) => <option key={member.id} value={member.id}>{member.display_name} · 스티커 {balanceByMemberId(member.id)}개</option>)}</select><input type="number" min={0} value={costPoints} onChange={(event) => onCostPointsChange(Number(event.target.value))} placeholder="필요 스티커 개수" style={inputStyle} /><button onClick={onCreate} disabled={loading} style={primaryButtonStyle(loading)}>{loading ? "생성 중..." : "보상 만들기"}</button></section><section style={dayTaskSectionStyle}><h2 style={sectionTitleStyle}>보상 목록</h2>{rewards.length === 0 ? <div style={emptyStateStyle}>등록된 보상이 없습니다.</div> : <div style={taskListStyle}>{rewards.map((reward) => { const balance = reward.target_member_id ? balanceByMemberId(reward.target_member_id) : 0; const canRedeem = reward.status !== "redeemed" && balance >= reward.cost_points; return <div key={reward.id} style={rewardCardStyle}><div><div style={taskTitleStyle}>{reward.title}</div>{reward.description && <div style={taskSubTextStyle}>{reward.description}</div>}<div style={taskSubTextStyle}>대상: {memberNameById(members, reward.target_member_id)} · 필요 {reward.cost_points}개 · 현재 {balance}개</div></div>{reward.status === "redeemed" ? <span style={statusBadgeStyle("approved")}>교환 완료</span> : <button onClick={() => onRedeem(reward)} disabled={loading || !canRedeem} style={canRedeem ? rewardButtonStyle : disabledRewardButtonStyle}>교환하기</button>}</div>; })}</div>}</section></>;
}

function TaskList({ tasks, members }: { tasks: Task[]; members: Member[]; }) {
  return <div style={taskListStyle}>{tasks.map((task) => <div key={task.id} style={taskCardStyle}><div><div style={taskTitleStyle}>{task.title}</div><div style={taskSubTextStyle}>대상: {memberNameById(members, task.assigned_member_id)}</div><div style={taskSubTextStyle}>인증: {verificationLabel(task.verification_type)} · 스티커 {task.reward_points}개</div></div><span style={statusBadgeStyle(task.status)}>{statusLabel(task.status)}</span></div>)}</div>;
}

function SettingsTab({ workspaces, workspace, members }: { workspaces: Workspace[]; workspace: Workspace; members: Member[]; }) {
  return <section style={createBoxStyle}><h2 style={sectionTitleStyle}>설정</h2><p style={subTextStyle}>프로필 수정, 초대코드, 워크스페이스 설정은 다음 단계에서 붙입니다.</p><div style={settingLineStyle}>현재 워크스페이스: <strong>{workspace.name}</strong></div><div style={settingLineStyle}>워크스페이스 수: {workspaces.length}</div><div style={settingLineStyle}>참여자 수: {members.length}</div></section>;
}

function BottomNav({ activeTab, onChange }: { activeTab: ActiveTab; onChange: (tab: ActiveTab) => void; }) {
  const items: { key: ActiveTab; label: string }[] = [{ key: "calendar", label: "캘린더" }, { key: "missions", label: "미션" }, { key: "rewards", label: "보상" }, { key: "settings", label: "설정" }];
  return <nav style={bottomNavStyle}>{items.map((item) => <button key={item.key} onClick={() => onChange(item.key)} style={activeTab === item.key ? bottomNavActiveStyle : bottomNavButtonStyle}>{item.label}</button>)}</nav>;
}

function tabTitle(tab: ActiveTab) { if (tab === "missions") return "미션"; if (tab === "rewards") return "보상"; if (tab === "settings") return "설정"; return "캘린더"; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function toDateKey(date: Date) { const year = date.getFullYear(); const month = `${date.getMonth() + 1}`.padStart(2, "0"); const day = `${date.getDate()}`.padStart(2, "0"); return `${year}-${month}-${day}`; }
function buildCalendarDays(currentMonth: Date) { const firstDay = startOfMonth(currentMonth); const startOffset = firstDay.getDay(); const calendarStart = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1 - startOffset); return Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index)); }
function formatKoreanDate(dateKey: string) { const [, month, day] = dateKey.split("-"); return `${Number(month)}월 ${Number(day)}일`; }
function memberNameById(members: Member[], id: string | null) { if (!id) return "미지정"; return members.find((member) => member.id === id)?.display_name || "미지정"; }
function verificationLabel(type: string) { if (type === "text") return "텍스트"; if (type === "photo") return "사진"; if (type === "video") return "영상"; if (type === "audio") return "음성"; return "없음"; }
function statusLabel(status: string) { if (status === "todo") return "대기"; if (status === "submitted") return "제출됨"; if (status === "approved") return "승인됨"; if (status === "rejected") return "반려됨"; return status; }
function statusBadgeStyle(status: string): CSSProperties { const colors: Record<string, { bg: string; text: string }> = { todo: { bg: "#fef3c7", text: "#92400e" }, submitted: { bg: "#dbeafe", text: "#1d4ed8" }, approved: { bg: "#dcfce7", text: "#15803d" }, rejected: { bg: "#fee2e2", text: "#b91c1c" } }; const color = colors[status] || colors.todo; return { height: "fit-content", padding: "4px 8px", borderRadius: 999, background: color.bg, color: color.text, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }; }
function primaryButtonStyle(loading: boolean): CSSProperties { return { width: "100%", padding: 14, borderRadius: 14, border: "none", background: loading ? "#94a3b8" : "#4f46e5", color: "#fff", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer" }; }

const pageStyle: CSSProperties = { minHeight: "100vh", background: "#e2f3f1", padding: 16, display: "flex", justifyContent: "center", alignItems: "flex-start" };
const phoneStyle: CSSProperties = { width: "100%", maxWidth: 480, minHeight: "calc(100vh - 32px)", background: "#fff", borderRadius: 28, padding: 22, boxShadow: "0 20px 60px rgba(15,23,42,0.12)" };
const topBarStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 };
const eyebrowStyle: CSSProperties = { color: "#4f46e5", fontSize: 13, fontWeight: 800 };
const headerTitleStyle: CSSProperties = { margin: 0, fontSize: 30, letterSpacing: "-0.04em" };
const titleStyle: CSSProperties = { margin: "0 0 8px", fontSize: 30, letterSpacing: "-0.04em" };
const subTextStyle: CSSProperties = { color: "#64748b", lineHeight: 1.6, marginBottom: 20 };
const tabGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 };
const inputStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbeafe", marginBottom: 12, outline: "none", fontSize: 15 };
const secondaryButtonStyle: CSSProperties = { width: "100%", padding: 13, borderRadius: 14, border: "1px solid #c7d2fe", background: "#eef2ff", color: "#4338ca", fontWeight: 800, cursor: "pointer" };
const logoutButtonStyle: CSSProperties = { border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: 14, padding: "10px 12px", fontWeight: 800, cursor: "pointer" };
const accountBoxStyle: CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 18, padding: 14, marginBottom: 16 };
const smallLabelStyle: CSSProperties = { display: "block", color: "#047857", fontSize: 12, fontWeight: 800, marginBottom: 4 };
const devLinkStyle: CSSProperties = { color: "#4f46e5", fontSize: 13, fontWeight: 800, textDecoration: "none" };
const workspaceSwitcherStyle: CSSProperties = { marginBottom: 18 };
const selectStyle: CSSProperties = { width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbeafe", background: "#fff", fontWeight: 700 };
const createBoxStyle: CSSProperties = { padding: 16, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: 18 };
const compactCreateBoxStyle: CSSProperties = { marginTop: 12 };
const summaryGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 };
const summaryCardStyle: CSSProperties = { padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "center" };
const summaryNumberStyle: CSSProperties = { fontSize: 20, fontWeight: 900, color: "#4f46e5" };
const summaryLabelStyle: CSSProperties = { marginTop: 4, fontSize: 11, color: "#64748b", fontWeight: 800 };
const calendarToolbarStyle: CSSProperties = { display: "grid", gridTemplateColumns: "44px 1fr 44px 64px", gap: 8, alignItems: "center", marginBottom: 12 };
const monthButtonStyle: CSSProperties = { height: 44, border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", fontSize: 24, fontWeight: 800, cursor: "pointer" };
const monthTitleStyle: CSSProperties = { textAlign: "center", fontWeight: 900, fontSize: 18 };
const todayButtonStyle: CSSProperties = { height: 44, border: "none", borderRadius: 14, background: "#4f46e5", color: "#fff", fontWeight: 800, cursor: "pointer" };
const calendarBoxStyle: CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 20, padding: 12, marginBottom: 18 };
const weekHeaderGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 };
const weekHeaderStyle: CSSProperties = { textAlign: "center", color: "#94a3b8", fontSize: 12, fontWeight: 800 };
const calendarGridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 };
const calendarDayStyle: CSSProperties = { minHeight: 54, border: "1px solid #e2e8f0", borderRadius: 14, background: "#fff", padding: 6, textAlign: "left", cursor: "pointer" };
const dayNumberStyle: CSSProperties = { fontWeight: 800, fontSize: 13 };
const dayMetaStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, color: "#64748b", fontWeight: 800 };
const pendingDotStyle: CSSProperties = { width: 6, height: 6, borderRadius: 999, background: "#3b82f6" };
const approvedDotStyle: CSSProperties = { width: 6, height: 6, borderRadius: 999, background: "#22c55e" };
const sectionTitleStyle: CSSProperties = { margin: "0 0 10px", fontSize: 20, letterSpacing: "-0.03em" };
const dayTaskSectionStyle: CSSProperties = { marginBottom: 80 };
const emptyStateStyle: CSSProperties = { padding: 18, borderRadius: 18, background: "#f8fafc", color: "#64748b", textAlign: "center" };
const taskListStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };
const taskCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 12 };
const rewardCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 12 };
const taskTitleStyle: CSSProperties = { fontWeight: 900, fontSize: 16 };
const taskSubTextStyle: CSSProperties = { marginTop: 5, color: "#64748b", fontSize: 13 };
const rewardButtonStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#f97316", color: "#fff", fontWeight: 800, cursor: "pointer" };
const disabledRewardButtonStyle: CSSProperties = { width: "100%", padding: 12, borderRadius: 14, border: "none", background: "#cbd5e1", color: "#64748b", fontWeight: 800, cursor: "not-allowed" };
const settingLineStyle: CSSProperties = { padding: 12, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, marginTop: 8, color: "#334155" };
const messageBoxStyle = (message: string): CSSProperties => { const ok = message.includes("완료") || message.includes("성공") || message.includes("불러오기") || message.includes("교환"); return { marginTop: 14, padding: 12, borderRadius: 14, background: ok ? "#ecfdf5" : "#fef2f2", color: ok ? "#047857" : "#b91c1c", fontSize: 14, lineHeight: 1.5 }; };
const bottomNavStyle: CSSProperties = { position: "sticky", bottom: 0, transform: "translateY(10px)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, background: "#fff", padding: "10px 0 0", borderTop: "1px solid #e2e8f0" };
const bottomNavButtonStyle: CSSProperties = { border: "none", background: "#f8fafc", borderRadius: 14, padding: "10px 4px", color: "#64748b", fontWeight: 800 };
const bottomNavActiveStyle: CSSProperties = { ...bottomNavButtonStyle, background: "#eef2ff", color: "#4f46e5" };
