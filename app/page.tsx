"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  titleStyle,
  subTextStyle,
  accountBoxStyle,
  accountInfoStyle,
  accountNameStyle,
  roleBadgeStyle,
  devLinkStyle,
  messageBoxStyle,
  summaryModalBackdropStyle,
  summaryModalPanelStyle,
  summaryModalHeaderStyle,
  summaryModalTitleStyle,
  summaryModalCloseButtonStyle,
  summaryModalBodyStyle,
} from "@/features/home/styles";
import NotificationPrompt from "@/features/notifications/NotificationPrompt";
import EditTaskModal from "@/features/tasks/EditTaskModal";

import Shell from "@/components/Shell";
import AppHeader from "@/components/AppHeader";
import AuthPanel from "@/components/AuthPanel";
import BottomNav from "@/components/BottomNav";

import DayTaskList from "@/features/calendar/DayTaskList";
import AddTaskModal from "@/features/tasks/AddTaskModal";
import RewardTab from "@/features/rewards/RewardTab";
import TaskList from "@/features/tasks/TaskList";
import MembersTab from "@/features/members/MembersTab";
import ViewSwitchTabs, { type CalendarViewMode } from "@/features/tasks/ViewSwitchTabs";
import TaskStatsCards from "@/features/tasks/TaskStatsCards";
import MonthView from "@/features/tasks/MonthView";
import WeekView from "@/features/tasks/WeekView";
import DayView from "@/features/tasks/DayView";

import { addMonths, startOfMonth, toDateKey } from "@/lib/date";
import { tabTitle, roleLabel } from "@/lib/labels";

import OnboardingGate, { type OnboardingStep } from "@/features/onboarding/OnboardingGate";
import NoWorkspacePrompt from "@/features/onboarding/NoWorkspacePrompt";

import { useAuth } from "@/features/auth/useAuth";
import { useWorkspace } from "@/features/workspace/useWorkspace";
import { useTasks } from "@/features/tasks/useTasks";
import { useRewards } from "@/features/rewards/useRewards";
import Avatar from "@/components/Avatar";
import SplashScreen from "@/components/SplashScreen";

import EmptyWorkspaceHome from "@/features/onboarding/EmptyWorkspaceHome";
import HamburgerMenu from "@/components/HamburgerMenu";
import ProfileSettingsPanel from "@/features/settings/ProfileSettingsPanel";
import IncomingInviteCard from "@/features/invite/IncomingInviteCard";

import type { ActiveTab, Task } from "@/types/app";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("tasks");
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const [summaryFilter, setSummaryFilter] = useState<"all" | "pending" | "approved" | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("month");

  const [menuOpen, setMenuOpen] = useState(false);
  const [plusSheetOpen, setPlusSheetOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showRenameWorkspaceModal, setShowRenameWorkspaceModal] = useState(false);
  const [renameWorkspaceValue, setRenameWorkspaceValue] = useState("");

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [taskPanelViewMode, setTaskPanelViewMode] = useState<"day" | "week">("day");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  
  function openEditTask(task: Task) {
    setEditingTask(task);
    setShowEditTaskModal(true);
  }

  function selectDateAndOpenPanel(dateKey: string) {
    setSelectedDate(dateKey);
    setTaskPanelOpen(true);
  }
  
  const [manageWorkspaceSignal, setManageWorkspaceSignal] = useState(0);
  
  function manageWorkspace(id: string) {
    const next = workspaces.find((item) => item.id === id) || null;
    setWorkspace(next);
    setActiveTab("members");
    setManageWorkspaceSignal((prev) => prev + 1);
  }

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
    uploadAvatar,
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
    leaveWorkspace,
    resetWorkspaceState,
    balanceByMemberId,
    toggleMyNotifications,
    renameWorkspace,
    incomingInvite,
    incomingInviteStatus,
    acceptIncomingInvite,
    declineIncomingInvite,
  } = workspaceHook;

  const currentWorkspaceIndex = workspace ? workspaces.findIndex((item) => item.id === workspace.id) : -1;
  
  function goToPrevWorkspace() {
    if (workspaces.length < 2 || currentWorkspaceIndex < 0) return;
    const nextIndex = (currentWorkspaceIndex - 1 + workspaces.length) % workspaces.length;
    setWorkspace(workspaces[nextIndex]);
  }
  
  function goToNextWorkspace() {
    if (workspaces.length < 2 || currentWorkspaceIndex < 0) return;
    const nextIndex = (currentWorkspaceIndex + 1) % workspaces.length;
    setWorkspace(workspaces[nextIndex]);
  }
  
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
    newTaskAssignedMemberIds,
    toggleAssignedMember,
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
    uncompleteTask,
    resetTaskState,
    reorderTasks,
    reorderTasksAcrossDates,
    updateTask,
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

  // 네이티브 앱(iOS/Android)에서는 로그인되면 OS 푸시 토큰을 등록한다.
  // 웹 브라우저에서는 no-op이며, 웹 푸시는 NotificationPrompt가 담당한다.
  useEffect(() => {
    if (!profile) return;
    import("@/lib/nativePush")
      .then((mod) => mod.registerNativePush())
      .catch(() => {});
  }, [profile?.id]);

  const selectedTasks = useMemo(() => {
    return tasks.filter((task) => task.due_date === selectedDate);
  }, [tasks, selectedDate]);

  const monthTaskCount = tasks.length;
  const todayKeyForStats = toDateKey(new Date());
  const todayTasks = tasks.filter((task) => task.due_date === todayKeyForStats);
  const todayDoneCount = todayTasks.filter((task) => task.status === "approved").length;
  const todayTotalCount = todayTasks.length;
  const monthUnfinishedCount = tasks.filter((task) => task.status !== "approved").length;
  const pendingCount = tasks.filter((task) => task.status === "submitted").length;
  const approvedCount = tasks.filter((task) => task.status === "approved").length;

  const summaryFilteredTasks = useMemo(() => {
    if (summaryFilter === "pending") return tasks.filter((task) => task.status === "submitted");
    if (summaryFilter === "approved") return tasks.filter((task) => task.status === "approved");
    if (summaryFilter === "all") return tasks;
    return [];
  }, [tasks, summaryFilter]);

  const isReady = !authLoading && (!profile || workspacesLoaded);

  if (showSplash) {
    return <SplashScreen ready={isReady} onFinish={() => setShowSplash(false)} />;
  }

  const showEmptyHome = Boolean(profile) && !pendingInviteCode && workspaces.length === 0;
  
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
          onRequestPasswordReset={requestPasswordReset}
        />
      </Shell>
    );
  }

  if (showEmptyHome) {
    if (showProfileSettings) {
      return (
        <Shell>
          <ProfileSettingsPanel
            profileDisplayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            myStickerBalance={currentMember ? (balanceByMemberId[currentMember.id] ?? 0) : 0}
            loading={loading}
            onUploadAvatar={uploadAvatar}
            myNickname={myNickname}
            onMyNicknameChange={setMyNickname}
            onSaveMyNickname={saveMyNickname}
            recoveryEmail={profileRecoveryEmail}
            onRecoveryEmailChange={setProfileRecoveryEmail}
            onSaveRecoveryEmail={saveRecoveryEmail}
            currentNicknameLabel={currentMember?.display_name ?? profile.display_name}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            onChangePassword={changePassword}
            onBack={() => setShowProfileSettings(false)}
            onGoToRewards={() => { setShowProfileSettings(false); setActiveTab("rewards"); }}
            onSignOut={signOut}
          />
        </Shell>
      );
    }

    if (showProfileSettings) {
      return (
        <Shell>
          <ProfileSettingsPanel
            profileDisplayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            myStickerBalance={currentMember ? (balanceByMemberId[currentMember.id] ?? 0) : 0}
            loading={loading}
            onUploadAvatar={uploadAvatar}
            myNickname={myNickname}
            onMyNicknameChange={setMyNickname}
            onSaveMyNickname={saveMyNickname}
            recoveryEmail={profileRecoveryEmail}
            onRecoveryEmailChange={setProfileRecoveryEmail}
            onSaveRecoveryEmail={saveRecoveryEmail}
            currentNicknameLabel={currentMember?.display_name ?? profile.display_name}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            onChangePassword={changePassword}
            onBack={() => setShowProfileSettings(false)}
            onGoToRewards={() => { setShowProfileSettings(false); setActiveTab("rewards"); }}
            onSignOut={signOut}
          />
        </Shell>
      );
    }
  
    return (
      <Shell>
        <EmptyWorkspaceHome
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenPlus={() => {
            setOnboardingStep("choice");
            setPlusSheetOpen(true);
          }}
        />
  
        <HamburgerMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          workspaces={workspaces}
          onManageWorkspace={manageWorkspace}
          onGoProfileSettings={() => setShowProfileSettings(true)}
          onCreateWorkspace={() => {
            setOnboardingStep("create");
            setPlusSheetOpen(true);
          }}
          onJoinWorkspace={() => {
            setOnboardingStep("join");
            setPlusSheetOpen(true);
          }}
          onShareApp={() => {
            const link = typeof window !== "undefined" ? window.location.origin : "";
            const text = `미루지말자와 함께 할 일을 관리해보세요!\n${link}`;
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              navigator.clipboard.writeText(text);
              setMessage("공유 링크를 복사했어요.");
            }
          }}
          onSignOut={signOut}
          onDeleteAccount={deleteAccount}
        />
  
        {plusSheetOpen && (
          <div style={plusSheetBackdropStyle} onClick={() => setPlusSheetOpen(false)}>
            <div style={plusSheetPanelStyle} onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPlusSheetOpen(false)}
                style={plusSheetCloseButtonStyle}
                aria-label="닫기"
              >
                ✕
              </button>
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
            </div>
          </div>
        )}
      </Shell>
    );
  }

  if (showProfileSettings) {
    return (
      <Shell>
        <ProfileSettingsPanel
          profileDisplayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          myStickerBalance={currentMember ? (balanceByMemberId[currentMember.id] ?? 0) : 0}
          loading={loading}
          onUploadAvatar={uploadAvatar}
          myNickname={myNickname}
          onMyNicknameChange={setMyNickname}
          onSaveMyNickname={saveMyNickname}
          recoveryEmail={profileRecoveryEmail}
          onRecoveryEmailChange={setProfileRecoveryEmail}
          onSaveRecoveryEmail={saveRecoveryEmail}
          currentNicknameLabel={currentMember?.display_name ?? profile.display_name}
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          onChangePassword={changePassword}
          onBack={() => setShowProfileSettings(false)}
          onGoToRewards={() => { setShowProfileSettings(false); setActiveTab("rewards"); }}
          onSignOut={signOut}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <AppHeader
        avatarUrl={profile.avatar_url}
        username={profile.display_name}
        nickname={currentMember?.display_name ?? null}
        roleText={currentMember ? roleLabel(currentMember.role) : null}
        workspaceName={workspace?.name ?? null}
        showWorkspaceControls={Boolean(workspace)}
        canSwitchWorkspace={workspaces.length > 1}
        onPrevWorkspace={goToPrevWorkspace}
        onNextWorkspace={goToNextWorkspace}
        notificationsEnabled={currentMember?.notifications_enabled ?? true}
        onToggleNotifications={toggleMyNotifications}
        onOpenMenu={() => setMenuOpen(true)}
        onWorkspaceNameClick={
          activeTab === "tasks" && workspace
            ? () => {
                setRenameWorkspaceValue(workspace.name);
                setShowRenameWorkspaceModal(true);
              }
            : undefined
        }
      />

      {incomingInviteStatus !== "idle" && (
        <IncomingInviteCard
          status={incomingInviteStatus}
          invite={incomingInvite}
          loading={loading}
          onAccept={acceptIncomingInvite}
          onDecline={declineIncomingInvite}
          onClose={declineIncomingInvite}
        />
      )}

      {workspace && activeTab === "tasks" && (
        <div style={statsSectionStyle}>
          <TaskStatsCards
            todayDoneCount={todayDoneCount}
            todayTotalCount={todayTotalCount}
            monthUnfinishedCount={monthUnfinishedCount}
            onClickToday={() => selectDateAndOpenPanel(todayKeyForStats)}
            onClickUnfinished={() => setSummaryFilter("all")}
          />
        </div>
      )}

{workspace && <NotificationPrompt />}
          {workspace && activeTab === "tasks" && (
            <div style={homeCardStyle}>
              <ViewSwitchTabs mode={calendarViewMode} onChange={setCalendarViewMode} />
              {calendarViewMode === "month" && (
                <MonthView
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  tasks={tasks}
                  onSelectDate={selectDateAndOpenPanel}
                  onPrevMonth={() => setCurrentMonth((prev) => addMonths(prev, -1))}
                  onNextMonth={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                  onToday={() => {
                    setCurrentMonth(startOfMonth(new Date()));
                    setSelectedDate(toDateKey(new Date()));
                  }}
                />
              )}
              {calendarViewMode === "week" && (
                <WeekView
                  selectedDate={selectedDate}
                  tasks={tasks}
                  members={activeMembers}
                  currentMember={currentMember}
                  isManager={isManager}
                  loading={loading}
                  onSelectDate={setSelectedDate}
                  onAddTask={(dateKey) => {
                    setSelectedDate(dateKey);
                    setShowAddTaskModal(true);
                  }}
                  onSubmitTask={submitTask}
                  onSubmitWithEvidence={submitTaskWithEvidence}
                  onSubmitWithText={submitTaskWithText}
                  onApproveTask={approveTask}
                  onRejectTask={rejectTask}
                  onCancelTask={cancelSubmission}
                  onDeleteTask={deleteTask}
                  onEditTask={openEditTask}
                  onUncompleteTask={uncompleteTask}
                  onReorderAcrossDates={reorderTasksAcrossDates}
                />
              )}
              {calendarViewMode === "day" && (
                <DayView
                  selectedDate={selectedDate}
                  tasks={selectedTasks}
                  members={activeMembers}
                  currentMember={currentMember}
                  isManager={isManager}
                  loading={loading}
                  onSelectDate={setSelectedDate}
                  onAddTask={() => setShowAddTaskModal(true)}
                  onSubmitTask={submitTask}
                  onSubmitWithEvidence={submitTaskWithEvidence}
                  onSubmitWithText={submitTaskWithText}
                  onApproveTask={approveTask}
                  onRejectTask={rejectTask}
                  onCancelTask={cancelSubmission}
                  onDeleteTask={deleteTask}
                  onReorderTasks={reorderTasks}
                  onEditTask={openEditTask}
                />
              )}
            </div>
          )}

          
          <DayTaskList
            isOpen={taskPanelOpen}
            onOpenChange={setTaskPanelOpen}
            viewMode={taskPanelViewMode}
            onViewModeChange={setTaskPanelViewMode}
            selectedDate={selectedDate}
            tasks={selectedTasks}
            monthTasks={tasks}
            members={activeMembers}
            currentMember={currentMember}
            isManager={isManager}
            loading={loading}
            onSelectDate={selectDateAndOpenPanel}
            onSubmitTask={submitTask}
            onApproveTask={approveTask}
            onRejectTask={rejectTask}
            onCancelTask={cancelSubmission}
            onDeleteTask={deleteTask}
            onAddTask={() => setShowAddTaskModal(true)}
            onSubmitWithEvidence={submitTaskWithEvidence}
            onSubmitWithText={submitTaskWithText}
            onReorderTasks={reorderTasks}
            onReorderAcrossDates={reorderTasksAcrossDates}
            templates={templates}
            onToggleTemplateActive={toggleTemplateActive}
            onDeleteTemplate={deleteTemplate}
            onRolloverNow={rolloverNow}
            onEditTask={openEditTask}
          />
      
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        selectedDate={selectedDate}
        members={activeMembers}
        title={newTaskTitle}
        description={newTaskDescription}
        assignedMemberIds={newTaskAssignedMemberIds}
        verificationType={newTaskVerificationType}
        dueTime={newTaskDueTime}
        rewardPoints={newTaskRewardPoints}
        repeatType={newTaskRepeatType}
        repeatWeekdays={newTaskRepeatWeekdays}
        loading={loading}
        onSelectedDateChange={setSelectedDate}
        onTitleChange={setNewTaskTitle}
        onDescriptionChange={setNewTaskDescription}
        onToggleAssignedMember={toggleAssignedMember}
        onVerificationTypeChange={setNewTaskVerificationType}
        onDueTimeChange={setNewTaskDueTime}
        onRewardPointsChange={setNewTaskRewardPoints}
        onRepeatTypeChange={setNewTaskRepeatType}
        onToggleRepeatWeekday={toggleRepeatWeekday}
        onCreate={createTask}
      />

      <EditTaskModal
        isOpen={showEditTaskModal}
        task={editingTask}
        loading={loading}
        onClose={() => setShowEditTaskModal(false)}
        onSave={updateTask}
      />

      {activeTab === "members" && (
        <>
          <div style={statsSectionStyle} />
          <div style={homeCardStyle}>
            <MembersTab
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
              onLeaveWorkspace={leaveWorkspace}
              focusWorkspaceManagementAt={manageWorkspaceSignal}
            />
          </div>
        </>
      )}
      
      {workspace && activeTab === "rewards" && (
        <>
          <div style={statsSectionStyle} />
          <div style={homeCardStyle}>
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
          </div>
        </>
      )}

      {!workspace && activeTab !== "members" && <NoWorkspacePrompt onGoSettings={() => setActiveTab("members")} />}

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
                  onUncomplete={uncompleteTask}
                />
              )}
            </div>
          </div>
        </div>
      )}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        workspaces={workspaces}
        onManageWorkspace={manageWorkspace}
        onGoProfileSettings={() => setShowProfileSettings(true)}
        onCreateWorkspace={() => {
          setOnboardingStep("create");
          setPlusSheetOpen(true);
        }}
        onJoinWorkspace={() => {
          setOnboardingStep("join");
          setPlusSheetOpen(true);
        }}
        onShareApp={() => {
          const link = typeof window !== "undefined" ? window.location.origin : "";
          const text = `함께 할 일을 관리해요!\n${link}`;
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setMessage("링크가 복사되었습니다.");
          }
        }}
        onSignOut={signOut}
        onDeleteAccount={deleteAccount}
      />

      
      {plusSheetOpen && (
        <div style={plusSheetBackdropStyle} onClick={() => setPlusSheetOpen(false)}>
          <div style={plusSheetPanelStyle} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPlusSheetOpen(false)}
              style={plusSheetCloseButtonStyle}
              aria-label="닫기"
            >
              ✕
            </button>
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
          </div>
        </div>
      )}
      {showRenameWorkspaceModal && (
        <div style={summaryModalBackdropStyle} onClick={() => setShowRenameWorkspaceModal(false)}>
          <div style={summaryModalPanelStyle} onClick={(event) => event.stopPropagation()}>
            <div style={summaryModalHeaderStyle}>
              <h2 style={summaryModalTitleStyle}>모임 이름 변경</h2>
              <button
                type="button"
                onClick={() => setShowRenameWorkspaceModal(false)}
                style={summaryModalCloseButtonStyle}
              >
                닫기
              </button>
            </div>
            <div style={summaryModalBodyStyle}>
              <input
                type="text"
                value={renameWorkspaceValue}
                onChange={(event) => setRenameWorkspaceValue(event.target.value)}
                placeholder="모임 이름을 입력하세요"
                maxLength={30}
                disabled={!isManager || loading}
                style={renameWorkspaceInputStyle}
              />
              {!isManager && (
                <p style={renameWorkspaceHintStyle}>방장/부방장만 모임 이름을 변경할 수 있습니다.</p>
              )}
              <button
                type="button"
                disabled={!isManager || loading || !renameWorkspaceValue.trim()}
                onClick={async () => {
                  const result = await renameWorkspace(renameWorkspaceValue);
                  if (result?.ok) setShowRenameWorkspaceModal(false);
                }}
                style={renameWorkspaceSaveButtonStyle(!isManager || loading || !renameWorkspaceValue.trim())}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </Shell>
  );
}

const plusSheetBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 10, 12, 0.4)",
  zIndex: 1000,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};
const plusSheetPanelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  maxHeight: "86vh",
  overflowY: "auto",
  background: "#fffaf9",
  borderRadius: "24px 24px 0 0",
  padding: 20,
  position: "relative",
};
const plusSheetCloseButtonStyle: CSSProperties = {
  position: "absolute",
  right: 16,
  top: 16,
  border: "none",
  background: "transparent",
  fontSize: 18,
  color: "#3f1d24",
  cursor: "pointer",
};
const statsSectionStyle: CSSProperties = {
  position: "relative",
  zIndex: 1,
  margin: "0 calc(-1 * var(--page-gutter)) -28px",
  padding: "14px var(--page-gutter) 44px",
  background: "linear-gradient(180deg, #6C63FF 0%, #5B52E0 100%)",
};

const homeCardStyle: CSSProperties = {
  position: "relative",
  zIndex: 2,
  margin: "0 calc(-1 * var(--page-gutter))",
  background: "#FFFFFF",
  borderRadius: "24px 24px 0 0",
  padding: "22px 16px 10px",
  boxShadow: "0 -6px 20px rgba(108, 99, 255, 0.08)",
};

const renameWorkspaceInputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #e5e0e6",
  fontSize: 15,
  marginBottom: 10,
};

const renameWorkspaceHintStyle: CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  marginTop: -4,
  marginBottom: 10,
};

function renameWorkspaceSaveButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: disabled ? "#D8D4F5" : "linear-gradient(135deg, #8B83EA, #6C63FF)",
    color: "#fff",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 6px 14px rgba(108, 99, 255, 0.30)",
  };
}
