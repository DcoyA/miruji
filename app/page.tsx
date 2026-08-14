"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

import { addMonths, startOfMonth, toDateKey } from "@/lib/date";
import { tabTitle, roleLabel } from "@/lib/labels";

import OnboardingGate, { type OnboardingStep } from "@/features/onboarding/OnboardingGate";
import NoWorkspacePrompt from "@/features/onboarding/NoWorkspacePrompt";

import { useAuth } from "@/features/auth/useAuth";
import { useWorkspace } from "@/features/workspace/useWorkspace";
import { useTasks } from "@/features/tasks/useTasks";
import { useRewards } from "@/features/rewards/useRewards";

import type { ActiveTab } from "@/types/app";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("calendar");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

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
    loadWorkspaceData,
    transferOwnership,
    deleteWorkspace,
    resetWorkspaceState,
    balanceByMemberId,
  } = workspaceHook;

  const tasksHook = useTasks({
    workspace,
    isManager,
    currentMember,
    members,
    selectedDate,
    setTasks,
    setTemplates,
    setRewardTransactions,
    loadWorkspaceData,
    setMessage,
    setLoading,
  });
  const {
    newTaskTitle,
    setNewTaskTitle,
    newTaskDescription,
    setNewTaskDescription,
    newTaskAssignedMemberId,
    setNewTaskAssignedMemberId,
    newTaskVerificationType,
    setNewTaskVerificationType,
    newTaskDueTime,
    setNewTaskDueTime,
    newTaskRewardPoints,
    setNewTaskRewardPoints,
    newTaskRepeatType,
    setNewTaskRepeatType,
    newTaskRepeatWeekdays,
    toggleRepeatWeekday,
    createTask,
    toggleTemplateActive,
    deleteTemplate,
    rolloverNow,
    submitTask,
    submitTaskWithText,
    submitTaskWithEvidence,
    cancelSubmission,
    deleteTask,
    approveTask,
    rejectTask,
    resetTaskState,
  } = tasksHook;

  const rewardsHook = useRewards({
    workspace,
    isManager,
    currentMember,
    members,
    balanceByMemberId,
    setRewards,
    setRewardTransactions,
    setMessage,
    setLoading,
  });
  const {
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
  } = rewardsHook;

  // profile 값이 바뀔 때 워크스페이스/task/reward 상태를 불러오거나 초기화합니다.
  useEffect(() => {
    if (profile) {
      loadWorkspaces();
    } else {
      resetWorkspaceState();
      resetTaskState();
      resetRewardState();
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
          onInviteSuggestedNameChange={setInviteSuggestedName}
          onCreateInvite={createInvite}
          pendingInvites={pendingInvites}
          onCancelPendingInvite={cancelPendingInvite}
          onRemoveMember={removeMember}
          onRestoreMember={restoreMember}
          joinInviteCode={joinInviteCode}
          onJoinInviteCodeChange={setJoinInviteCode}
          onAcceptInvite={() => acceptInviteCode()}
          onDeleteAccount={deleteAccount}
          onTransferOwnership={transferOwnership}
          onUpdateMemberRole={updateMemberRole}
          onDeleteWorkspace={deleteWorkspace}
          myNickname={myNickname}
          onMyNicknameChange={setMyNickname}
          onSaveMyNickname={saveMyNickname}
          recoveryEmail={profileRecoveryEmail}
          onRecoveryEmailChange={setProfileRecoveryEmail}
          onSaveRecoveryEmail={saveRecoveryEmail}
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          onChangePassword={changePassword}
        />
      )}

      {!workspace && activeTab !== "settings" && <NoWorkspacePrompt onGoSettings={() => setActiveTab("settings")} />}

      {message && <div style={messageBoxStyle(message)}>{message}</div>}
      {summaryFilter && (
        <div style={summaryModalBackdropStyle} onClick={() => setSummaryFilter(null)}>
          <div style={summaryModalPanelStyle} onClick={(event) => event.stopPropagation()}>
            <div style={summaryModalHeaderStyle}>
              <h2 style={summaryModalTitleStyle}>
                {summaryFilter === "all"
                  ? "이번 달 전체 할 일"
                  : summaryFilter === "pending"
                  ? "제출된 할 일"
                  : "승인된 할 일"}
              </h2>
              <button
                type="button"
                onClick={() => setSummaryFilter(null)}
                style={summaryModalCloseButtonStyle}
              >
                닫기
              </button>
            </div>
            <div style={summaryModalBodyStyle}>
              {summaryFilteredTasks.length === 0 ? (
                <div style={subTextStyle}>해당하는 할 일이 없습니다.</div>
              ) : (
                <TaskList
                  tasks={summaryFilteredTasks}
                  members={activeMembers}
                  currentMember={currentMember}
                  isManager={isManager}
                  loading={loading}
                  onSubmit={submitTask}
                  onSubmitWithEvidence={submitTaskWithEvidence}
                  onSubmitWithText={submitTaskWithText}
                  onApprove={approveTask}
                  onReject={rejectTask}
                  onCancel={cancelSubmission}
                  onDelete={deleteTask}
                />
              )}
            </div>
          </div>
        </div>
      )}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </Shell>
  );
}

const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 30,
  letterSpacing: "-0.04em",
  fontWeight: 800,
  color: "#3f1d24",
};
const subTextStyle: CSSProperties = { color: "#9f6b75", lineHeight: 1.6, marginBottom: 20 };
const accountBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#ffffff",
  borderRadius: 20,
  padding: "14px 16px",
  marginBottom: 20,
  boxShadow: "0 4px 16px rgba(190, 24, 93, 0.08)",
};

const avatarStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 18,
  flexShrink: 0,
};

const accountInfoStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const accountNameStyle: CSSProperties = {
  fontSize: 15,
  color: "#3f1d24",
};

const roleBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "3px 10px",
  borderRadius: 999,
  background: "#ffe4e6",
  color: "#be123c",
  fontSize: 11,
  fontWeight: 800,
};

const devLinkStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};

const messageBoxStyle = (message: string): CSSProperties => {
  const ok = message.includes("완료") || message.includes("성공") || message.includes("보냈습니다") || message.includes("변경") || message.includes("저장");
  return { marginTop: 14, padding: 12, borderRadius: 14, background: ok ? "#ecfdf5" : "#fef2f2", color: ok ? "#047857" : "#b91c1c", fontSize: 14, lineHeight: 1.5 };
};

const summaryModalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(63,29,36,0.45)",
  zIndex: 50,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const summaryModalPanelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  maxHeight: "80dvh",
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  display: "flex",
  flexDirection: "column",
  paddingTop: "env(safe-area-inset-top)",
};

const summaryModalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 18px 12px",
  borderBottom: "1px solid #f6e8e6",
};

const summaryModalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  letterSpacing: "-0.03em",
  color: "#3f1d24",
};

const summaryModalCloseButtonStyle: CSSProperties = {
  border: "1px solid #f1d9dd",
  background: "#fff",
  color: "#9f6b75",
  borderRadius: 999,
  padding: "6px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

const summaryModalBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "14px 18px 28px",
};
