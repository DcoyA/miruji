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
import TaskList from "@/features/tasks/TaskList";
import SettingsTab from "@/features/settings/SettingsTab";

import { addMonths, endOfMonth, startOfMonth, toDateKey } from "@/lib/date";
import { tabTitle, roleLabel } from "@/lib/labels";

import OnboardingGate, { type OnboardingStep } from "@/features/onboarding/OnboardingGate";
import NoWorkspacePrompt from "@/features/onboarding/NoWorkspacePrompt";

const PENDING_INVITE_STORAGE_KEY = "miruji_pending_invite_code";

import type {
  ActiveTab,
  Member,
  Profile,
  Reward,
  RewardTransaction,
  Task,
  TaskTemplate,
  Workspace,
} from "@/types/app";

const memberSelect =
  "id, profile_id, display_name, role, is_virtual, requires_account, status";
const taskSelect =
  "id, workspace_id, title, description, status, due_date, assigned_member_id, verification_type, reward_points, template_id, created_by_member_id, evidence_url, evidence_text";
const taskTemplateSelect =
  "id, workspace_id, title, description, assigned_member_id, verification_type, reward_points, rollover_enabled, repeat_type, repeat_weekdays, is_active";
const rewardSelect =
  "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status";
const rewardTxSelect =
  "id, member_id, amount, transaction_type, source_type, source_id, memo, created_at";

type MemberRole = "manager" | "member";
type RepeatType = "none" | "daily" | "weekly";

type InviteAcceptResult = {
  workspace_id?: string;
  member_id?: string;
  status?: string;
};

export default function Home() {
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("choice");

  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
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
  const [newTaskRepeatType, setNewTaskRepeatType] = useState<RepeatType>("none");
  const [newTaskRepeatWeekdays, setNewTaskRepeatWeekdays] = useState<number[]>([]);

  const [newRewardTitle, setNewRewardTitle] = useState("");
  const [newRewardDescription, setNewRewardDescription] = useState("");
  const [newRewardTargetMemberId, setNewRewardTargetMemberId] = useState("");
  const [newRewardCostPoints, setNewRewardCostPoints] = useState(1);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>("member");
  const [newMemberHasEmail, setNewMemberHasEmail] = useState(true);
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<Record<string, string>>({});
  const [myNickname, setMyNickname] = useState("");

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

  useEffect(() => {
    if (profile && workspacesLoaded && !profile.onboarding_completed && workspaces.length > 0) {
      markOnboardingComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.onboarding_completed, workspacesLoaded, workspaces.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(PENDING_INVITE_STORAGE_KEY);
    if (stored) {
      setPendingInviteCode(stored);
      setJoinInviteCode(stored);
    }
  }, []);
  
  useEffect(() => {
    if (!pendingInviteCode) return;
    if (!profile || !workspacesLoaded || loading) return;
  
    const codeToConsume = pendingInviteCode;
    setPendingInviteCode(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
    }
    acceptInviteCode(codeToConsume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingInviteCode, profile?.id, workspacesLoaded, loading]);
  
  const selectedTasks = useMemo(() => {
    return tasks.filter((task) => task.due_date === selectedDate);
  }, [tasks, selectedDate]);

  const currentMember = useMemo(() => {
    if (!profile) return null;
    return members.find((member) => member.profile_id === profile.id) || null;
  }, [members, profile]);

  useEffect(() => {
    if (currentMember) setMyNickname(currentMember.display_name);
  }, [currentMember?.id, currentMember?.display_name]);

  useEffect(() => {
    if (!workspace) return;
  
    const channel = supabase
      .channel(`workspace-members-${workspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workspace_members",
          filter: `workspace_id=eq.${workspace.id}`,
        },
        () => {
          loadWorkspaceData(workspace.id);
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const isManager =
    currentMember?.role === "owner" || currentMember?.role === "manager";

  const activeMembers = useMemo(
    () => members.filter((member) => member.status !== "removed"),
    [members]
  );

  const monthTaskCount = tasks.length;
  const pendingCount = tasks.filter((task) => task.status === "submitted").length;
  const approvedCount = tasks.filter((task) => task.status === "approved").length;

  const [summaryFilter, setSummaryFilter] = useState<"all" | "pending" | "approved" | null>(null);

  const summaryFilteredTasks = useMemo(() => {
    if (summaryFilter === "pending") return tasks.filter((task) => task.status === "submitted");
    if (summaryFilter === "approved") return tasks.filter((task) => task.status === "approved");
    if (summaryFilter === "all") return tasks;
    return [];
  }, [tasks, summaryFilter]);
  
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
    const fallbackName = userData.user?.email?.split("@")[0] || "";

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

  async function markOnboardingComplete() {
    if (!profile || profile.onboarding_completed) return;

    const { data, error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", profile.id)
      .select("id, auth_user_id, display_name, avatar_url, onboarding_completed")
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }

  async function signUp() {
    if (!authEmail.trim() || !authPassword.trim()) {
      setMessage("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (!agreedToTerms) {
      setMessage("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://miruji-git-main-iamborghini5757-1567s-projects.vercel.app";

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword.trim(),
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
        data: {
          display_name: authEmail.split("@")[0],
          app_name: "",
        },
      },
    });

    if (error) {
      console.error("signUp error", error);
      const detail =
        error.message && error.message.trim() && error.message !== "{}"
          ? error.message
          : `오류 코드: ${(error as any).status ?? error.name ?? "알 수 없음"}`;
      setMessage(`가입 실패: ${detail}`);
      setLoading(false);
      return;
    }

    const isAlreadyRegistered = data.user && (data.user.identities?.length ?? 0) === 0;

    if (isAlreadyRegistered) {
      setMessage("이미 가입된 계정입니다. 로그인해주세요.");
      setLoading(false);
      return;
    }

    setMessage("가입 완료. 이메일 인증 후 로그인해주세요.");
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
      setMessage("로그인에 실패했습니다.");
      setLoading(false);
      return;
    }

    const loadedProfile = await loadProfile(data.user.id);
    if (loadedProfile) {
      await loadWorkspaces();
      setMessage("로그인 완료");
    }
    setLoading(false);
  }

  async function requestPasswordReset() {
    if (!authEmail.trim()) {
      setMessage("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://miruji-omega.vercel.app";

    const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
      redirectTo: `${appUrl}/auth/reset`,
    });

    if (error) {
      console.error("resetPasswordForEmail error", error);
      const detail =
        error.message && error.message.trim() && error.message !== "{}"
          ? error.message
          : `오류 코드: ${(error as any).status ?? error.name ?? "알 수 없음"}`;
      setMessage(`재설정 링크 전송 실패: ${detail}`);
      setLoading(false);
      return;
    }

    setMessage("재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요.");
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
    setMessage("");
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "정말 계정을 삭제하시겠습니까? 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("인증 정보를 확인할 수 없습니다.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.error === "SOLE_OWNER") {
        setMessage(
          "혼자 owner인 모임이 있어 탈퇴할 수 없습니다. 설정 탭에서 다른 참여자에게 소유권을 넘기거나, 해당 모임을 삭제한 뒤 다시 시도해주세요."
        );
      } else {
        setMessage("계정 삭제에 실패했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("계정이 삭제되었습니다.");
    setLoading(false);
  }

  async function transferOwnership(targetMember: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }
  
    if (currentMember?.role !== "owner") {
      setMessage("owner만 소유권을 넘길 수 있습니다.");
      return;
    }
  
    if (!targetMember.profile_id) {
      setMessage("계정이 연결된 참여자에게만 소유권을 넘길 수 있습니다.");
      return;
    }
  
    const confirmed = window.confirm(
      `${targetMember.display_name}에게 owner 권한을 넘기시겠습니까? 넘긴 후 본인은 manager로 변경됩니다.`
    );
    if (!confirmed) return;
  
    setLoading(true);
    setMessage("");
  
    const { error } = await supabase.rpc("transfer_workspace_ownership", {
      target_workspace_id: workspace.id,
      new_owner_member_id: targetMember.id,
    });
  
    if (error) {
      setMessage(`소유권 이전 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    await loadWorkspaceData(workspace.id);
    setMessage(`${targetMember.display_name}에게 owner 권한을 넘겼습니다.`);
    setLoading(false);
  }
  
  async function deleteWorkspace(targetWorkspace: Workspace) {
    if (currentMember?.role !== "owner") {
      setMessage("방장만 모임을 삭제할 수 있습니다.");
      return;
    }
  
    const confirmed = window.confirm(
      `"${targetWorkspace.name}" 모임을 삭제하시겠습니까? 모든 할 일, 참여자, 보상 데이터가 함께 삭제되며 되돌릴 수 없습니다. 다른 참여자의 동의는 필요하지 않습니다.`
    );
    if (!confirmed) return;
  
    setLoading(true);
    setMessage("");
  
    const { error } = await supabase.from("workspaces").delete().eq("id", targetWorkspace.id);
  
    if (error) {
      setMessage(`모임 삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    setWorkspaces((prev) => prev.filter((item) => item.id !== targetWorkspace.id));
    setWorkspace((prev) => (prev?.id === targetWorkspace.id ? null : prev));
    setMessage(`${targetWorkspace.name} 모임이 삭제되었습니다.`);
    setLoading(false);
  
    await loadWorkspaces();
  }

  
  function resetState() {
    setWorkspaces([]);
    setWorkspace(null);
    setWorkspacesLoaded(false);
    setOnboardingStep("choice");
    setMembers([]);
    setTasks([]);
    setTemplates([]);
    setRewards([]);
    setRewardTransactions([]);
    setWorkspaceName("");
    setWorkspaceDescription("");
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
    setNewMemberName("");
    setNewMemberRole("member");
    setNewMemberHasEmail(true);
    setInviteCodes({});
    setJoinInviteCode("");
    setAgreedToTerms(false);
  }

  async function loadWorkspaces() {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, description")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`워크스페이스 불러오기 실패: ${error.message}`);
      setWorkspacesLoaded(true);
      return;
    }

    const list = (data || []) as Workspace[];
    setWorkspaces(list);
    setWorkspace((current) => {
      if (current && list.some((item) => item.id === current.id)) return current;
      return list[0] || null;
    });
    setWorkspacesLoaded(true);
  }

  async function createWorkspace() {
    if (!profile) {
      setMessage("프로필이 없습니다.");
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
      display_name: profile.display_name || "",
      role: "owner",
      status: "active",
      is_virtual: false,
      requires_account: true,
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
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (!newMemberName.trim()) {
      setMessage("이름을 입력해주세요.");
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
        requires_account: newMemberHasEmail,
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
    setNewMemberHasEmail(true);
    setMessage(`참여자 추가 완료: ${data.display_name}`);
    setLoading(false);
  }

  function makeInviteCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }

  async function createInviteForMember(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (!member.is_virtual) {
      setMessage("이미 실제 계정과 연결된 참여자입니다.");
      return;
    }

    if (!member.requires_account) {
      setMessage("먼저 '실제 계정으로 전환하기'를 눌러주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const manager = members.find((item) => item.role === "owner" || item.role === "manager");
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

    setInviteCodes((prev) => ({ ...prev, [member.id]: inviteCode }));
    setMessage(`초대코드 생성 완료: ${inviteCode}`);
    setInviteExpiresAt((prev) => ({
      ...prev,
      [member.id]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    setLoading(false);
  }

  async function cancelInvite(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }
  
    if (!isManager) {
      setMessage("보호자/관리자만 가능합니다.");
      return;
    }
  
    const confirmed = window.confirm(
      `${member.display_name}에게 발급한 초대코드를 취소하시겠습니까?`
    );
    if (!confirmed) return;
  
    setLoading(true);
    setMessage("");
  
    const { error } = await supabase
      .from("workspace_invites")
      .update({ status: "cancelled" })
      .eq("workspace_id", workspace.id)
      .eq("target_member_id", member.id)
      .eq("status", "pending");
  
    if (error) {
      setMessage(`초대코드 취소 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    setInviteCodes((prev) => {
      const next = { ...prev };
      delete next[member.id];
      return next;
    });
    setInviteExpiresAt((prev) => {
      const next = { ...prev };
      delete next[member.id];
      return next;
    });
    setMessage(`${member.display_name}의 초대코드를 취소했습니다.`);
    setLoading(false);
  }
  
  async function enableAccountForMember(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (!member.is_virtual || member.requires_account) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ requires_account: true })
      .eq("id", member.id)
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`전환 처리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
    setMessage(`${member.display_name} 계정 전환 준비 완료. 초대코드를 생성해주세요.`);
    setLoading(false);
  }

  async function removeMember(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (member.role === "owner") {
      setMessage("owner는 제외할 수 없습니다.");
      return;
    }

    const confirmed = window.confirm(
      `${member.display_name}님을 제외하시겠습니까? 기록은 유지되고 나중에 복구할 수 있습니다.`
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ status: "removed" })
      .eq("id", member.id)
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`제외 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
    setMessage(`${member.display_name}님을 제외했습니다.`);
    setLoading(false);
  }

  async function restoreMember(member: Member) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ status: "active" })
      .eq("id", member.id)
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`복구 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
    setMessage(`${member.display_name}님을 복구했습니다.`);
    setLoading(false);
  }

  async function saveMyNickname() {
    if (!workspace || !currentMember) {
      setMessage("현재 참여 중인 멤버 정보가 없습니다.");
      return;
    }
  
    const trimmed = myNickname.trim();
    if (!trimmed) {
      setMessage("닉네임을 입력해주세요.");
      return;
    }
  
    if (trimmed === currentMember.display_name) return;
  
    setLoading(true);
    setMessage("");
  
    const { data, error } = await supabase
      .from("workspace_members")
      .update({ display_name: trimmed })
      .eq("id", currentMember.id)
      .select(memberSelect)
      .single();
  
    if (error) {
      setMessage(`닉네임 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    setMembers((prev) => prev.map((item) => (item.id === currentMember.id ? (data as Member) : item)));
    setMessage(`닉네임을 "${trimmed}"으로 바꿨습니다.`);
    setLoading(false);
  }
  
  async function acceptInviteCode(codeOverride?: string) {
    const codeToUse = (codeOverride ?? joinInviteCode).trim();
  
    if (!codeToUse) {
      setMessage("초대 코드를 입력해주세요.");
      return;
    }
  
    setLoading(true);
    setMessage("");
  
    const { data, error } = await supabase.rpc("accept_workspace_invite", {
      input_code: codeToUse.toUpperCase(),
    });
  
    if (error) {
      setMessage(`참여 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    setJoinInviteCode("");
    setMessage("워크스페이스에 참여했습니다");
  
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

    const [membersResult, tasksResult, templatesResult, rewardsResult, rewardTransactionsResult] = await Promise.all([
      supabase.from("workspace_members").select(memberSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
      supabase.from("tasks").select(taskSelect).eq("workspace_id", workspaceId).gte("due_date", monthStart).lte("due_date", monthEnd).order("due_date", { ascending: true }),
      supabase.from("task_templates").select(taskTemplateSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
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

    if (templatesResult.error) {
      setMessage(`반복 미션 불러오기 실패: ${templatesResult.error.message}`);
      return;
    }

    if (rewardsResult.error) {
      setMessage(`보상 불러오기 실패: ${rewardsResult.error.message}`);
      return;
    }

    if (rewardTransactionsResult.error) {
      setMessage(`포인트 내역 불러오기 실패: ${rewardTransactionsResult.error.message}`);
      return;
    }

    setMembers((membersResult.data || []) as Member[]);
    setTasks((tasksResult.data || []) as Task[]);
    setTemplates((templatesResult.data || []) as TaskTemplate[]);
    setRewards((rewardsResult.data || []) as Reward[]);
    setRewardTransactions((rewardTransactionsResult.data || []) as RewardTransaction[]);
  }

  function toggleRepeatWeekday(day: number) {
    setNewTaskRepeatWeekdays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  async function createTask() {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
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
      setMessage("미션 생성 완료");
    } else {
      const { data: templateData, error: templateError } = await supabase
        .from("task_templates")
        .insert({
          workspace_id: workspace.id,
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          assigned_member_id: newTaskAssignedMemberId,
          verification_type: newTaskVerificationType,
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
        setMessage(`반복 미션 생성 실패: ${templateError.message}`);
        setLoading(false);
        return;
      }

      setTemplates((prev) => [...prev, templateData as TaskTemplate]);

      const { error: generateError } = await supabase.rpc("generate_recurring_tasks");

      if (generateError) {
        setMessage(`반복 미션은 등록됐지만 오늘 일정 생성에 실패했습니다: ${generateError.message}`);
        setLoading(false);
        return;
      }

      await loadWorkspaceData(workspace.id);
      setMessage("반복 미션 생성 완료");
    }

    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskVerificationType("none");
    setNewTaskRewardPoints(1);
    setNewTaskRepeatType("none");
    setNewTaskRepeatWeekdays([]);
    setLoading(false);
  }

  async function toggleTemplateActive(template: TaskTemplate) {
    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
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
      setMessage(`반복 미션 상태 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    const updated = data as TaskTemplate;
    setTemplates((prev) => prev.map((item) => (item.id === template.id ? updated : item)));
    setMessage(`${template.title} ${updated.is_active ? "재개" : "일시중지"}`);
    setLoading(false);
  }

  async function deleteTemplate(template: TaskTemplate) {
    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    const confirmed = window.confirm(
      `"${template.title}" 반복 미션을 삭제하시겠습니까? 이미 생성된 미션 기록은 남습니다.`
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
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.rpc("rollover_overdue_tasks");

    if (error) {
      setMessage(`정리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    await loadWorkspaceData(workspace.id);
    setMessage("지난 미션을 정리했습니다.");
    setLoading(false);
  }

  async function createReward() {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (!newRewardTitle.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }

    if (!newRewardTargetMemberId) {
      setMessage("대상을 선택해주세요.");
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

  async function deleteReward(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }
  
    if (!isManager) {
      setMessage("보호자/관리자만 가능합니다.");
      return;
    }
  
    if (reward.status !== "approved") {
      setMessage("이미 신청되었거나 완료된 보상은 삭제할 수 없습니다.");
      return;
    }
  
    const confirmed = window.confirm(`"${reward.title}" 보상을 삭제하시겠습니까?`);
    if (!confirmed) return;
  
    setLoading(true);
    setMessage("");
  
    const { error } = await supabase.from("rewards").delete().eq("id", reward.id);
  
    if (error) {
      setMessage(`보상 삭제 실패: ${error.message}`);
      setLoading(false);
      return;
    }
  
    setRewards((prev) => prev.filter((item) => item.id !== reward.id));
    setMessage(`${reward.title} 보상이 삭제되었습니다.`);
    setLoading(false);
  }

  async function requestRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }
  
    if (currentMember?.id !== reward.target_member_id) {
      setMessage("본인에게 배정된 보상만 신청할 수 있습니다.");
      return;
    }
  
    if (reward.status !== "approved") {
      setMessage("신청할 수 없는 상태입니다.");
      return;
    }
  
    const balance = balanceByMemberId(reward.target_member_id);
    if (balance < reward.cost_points) {
      setMessage(`스티커가 부족합니다. 필요 ${reward.cost_points}개 / 보유 ${balance}개`);
      return;
    }
  
    setLoading(true);
    setMessage("");
  
    // 방장이 자기 자신의 보상을 신청하는 경우: 별도 승인 단계 없이 즉시 교환 처리
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
    setMessage(`${reward.title} 교환을 신청했습니다. 방장 승인을 기다려주세요.`);
    setLoading(false);
  }


  async function confirmRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 승인할 수 있습니다.");
      return;
    }

    if (!reward.target_member_id) {
      setMessage("대상 참여자가 없습니다.");
      return;
    }

    if (reward.status !== "requested") {
      setMessage("신청된 보상만 승인할 수 있습니다.");
      return;
    }

    const balance = balanceByMemberId(reward.target_member_id);
    if (balance < reward.cost_points) {
      setMessage(`스티커가 부족합니다. 필요 ${reward.cost_points}개 / 현재 ${balance}개`);
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
    setMessage(`교환 승인 완료: ${reward.title}`);
    setLoading(false);
  }

  async function rejectRedeem(reward: Reward) {
    if (!workspace) {
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 거절할 수 있습니다.");
      return;
    }

    if (reward.status !== "requested") {
      setMessage("신청된 보상만 거절할 수 있습니다.");
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
      setMessage(`거절 처리 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setRewards((prev) => prev.map((item) => (item.id === reward.id ? (data as Reward) : item)));
    setMessage(`${reward.title} 신청을 거절했습니다.`);
    setLoading(false);
  }

  async function submitTask(task: Task) {
     if (!workspace) {
      setMessage("작업 공간이 없습니다.");
      return;
    }

    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("제출할 수 없는 상태입니다.");
      return;
    }

    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("본인에게 배정된 미션만 제출할 수 있습니다.");
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

  async function submitTaskWithEvidence(task: Task, file: File) {
    if (!workspace) {
      setMessage("작업 공간이 없습니다.");
      return;
    }
  
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("이미 제출되었거나 처리된 할 일입니다.");
      return;
    }
  
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("본인에게 배정된 할 일만 제출할 수 있습니다.");
      return;
    }

  async function submitTaskWithText(task: Task, text: string) {
    if (!workspace) {
      setMessage("워크스페이스 정보가 없습니다.");
      return;
    }
  
    if (task.status !== "todo" && task.status !== "rolled_over" && task.status !== "rejected") {
      setMessage("지금 상태에서는 제출할 수 없습니다.");
      return;
    }
  
    if (!isManager && task.assigned_member_id !== currentMember?.id) {
      setMessage("본인에게 배정된 할 일만 제출할 수 있습니다.");
      return;
    }
  
    if (!text.trim()) {
      setMessage("인증 내용을 입력해 주세요.");
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
    
    setLoading(true);
    setMessage("");
  
    const filePath = `${workspace.id}/${task.id}-${Date.now()}-${file.name}`;
  
    const { error: uploadError } = await supabase.storage
      .from("task-evidence")
      .upload(filePath, file, { upsert: false });
  
    if (uploadError) {
      setMessage(`사진 업로드 실패: ${uploadError.message}`);
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
    setMessage(`${task.title} 사진과 함께 제출했습니다.`);
    setLoading(false);
  }

  
  async function cancelSubmission(task: Task) {
  if (!workspace) {
    setMessage("워크스페이스를 불러오지 못했습니다.");
    return;
  }

  if (task.status !== "submitted") {
    setMessage("제출된 할 일만 회수할 수 있습니다.");
    return;
  }

  if (!isManager && task.assigned_member_id !== currentMember?.id) {
    setMessage("본인에게 배정된 할 일만 회수할 수 있습니다.");
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
    setMessage(`회수 실패: ${error.message}`);
    setLoading(false);
    return;
  }

  setTasks((prev) => prev.map((item) => (item.id === task.id ? (data as Task) : item)));
  setMessage(`${task.title} 제출을 회수했습니다.`);
  setLoading(false);
}

  async function deleteTask(task: Task) {
    if (!workspace) {
      setMessage("워크스페이스를 불러오지 못했습니다.");
      return;
    }
  
    const canDelete = isManager || task.created_by_member_id === currentMember?.id;
    if (!canDelete) {
      setMessage("할 일을 만든 사람 또는 관리자만 삭제할 수 있습니다.");
      return;
    }
  
    const confirmed = window.confirm(`"${task.title}" 할 일을 삭제하시겠습니까? 승인된 내역도 함께 삭제됩니다.`);
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
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (task.status !== "submitted") {
      setMessage("제출된 미션만 승인할 수 있습니다.");
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
          memo: `${task.title} 승인`,
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
      setMessage("워크스페이스가 없습니다.");
      return;
    }

    if (!isManager) {
      setMessage("매니저/오너만 가능합니다.");
      return;
    }

    if (task.status !== "submitted") {
      setMessage("제출된 미션만 반려할 수 있습니다.");
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
    setMessage(`${task.title} 반려 처리.`);
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
        <h1 style={titleStyle}>미루지</h1>
        <p style={subTextStyle}>인증 정보를 확인하는 중...</p>
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
            agreedToTerms={agreedToTerms}
            onModeChange={setAuthMode}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onAgreedToTermsChange={setAgreedToTerms}
            onSignIn={signIn}
            onSignUp={signUp}
            onSendPasswordReset={requestPasswordReset}
        />
      </Shell>
    );
  }

  if (!workspacesLoaded) {
    return (
      <Shell>
        <h1 style={titleStyle}>미루지</h1>
        <p style={subTextStyle}>워크스페이스를 불러오는 중...</p>
      </Shell>
    );
  }

  const needsOnboarding = !profile.onboarding_completed && workspaces.length === 0;

  if (needsOnboarding) {
    if (pendingInviteCode) {
      return (
        <Shell>
          <AppHeader title="미루지말자" loading={loading} onSignOut={signOut} />
          <h1 style={titleStyle}>초대 확인 중...</h1>
          <p style={subTextStyle}>초대 코드로 워크스페이스에 자동으로 참여하고 있어요.</p>
          {message && <div style={messageBoxStyle(message)}>{message}</div>}
        </Shell>
      );
    }
  
    return (
      <Shell>
        <AppHeader title="미루지말자" loading={loading} onSignOut={signOut} />
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
          newMemberHasEmail={newMemberHasEmail}
          onNewMemberNameChange={setNewMemberName}
          onNewMemberRoleChange={setNewMemberRole}
          onNewMemberHasEmailChange={setNewMemberHasEmail}
          onAddMember={addMember}
          inviteCodes={inviteCodes}
          onCreateInvite={createInviteForMember}
          onEnableAccount={enableAccountForMember}
          onRemoveMember={removeMember}
          onRestoreMember={restoreMember}
          joinInviteCode={joinInviteCode}
          onJoinInviteCodeChange={setJoinInviteCode}
          onAcceptInvite={() => acceptInviteCode()}
          onDeleteAccount={deleteAccount}
          onTransferOwnership={transferOwnership}
          onCancelInvite={cancelInvite}
          inviteExpiresAt={inviteExpiresAt}
          onDeleteWorkspace={deleteWorkspace}
          myNickname={myNickname}
          onMyNicknameChange={setMyNickname}
          onSaveMyNickname={saveMyNickname}
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
                  ? "이번 달 할 일"
                  : summaryFilter === "pending"
                  ? "승인 대기"
                  : "승인 완료"}
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
  const ok = message.includes("완료") || message.includes("성공") || message.includes("신청") || message.includes("승인") || message.includes("정리");
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
