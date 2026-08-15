"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { endOfMonth, startOfMonth, toDateKey } from "@/lib/date";
import { roleLabel } from "@/lib/labels";
import { PENDING_INVITE_STORAGE_KEY } from "@/lib/constants";
import type {
  ActiveTab,
  Member,
  Profile,
  Reward,
  RewardTransaction,
  Task,
  TaskTemplate,
  Workspace,
  WorkspaceInvite,
} from "@/types/app";

export const memberSelect =
  "id, profile_id, display_name, role, is_virtual, requires_account, status, avatar_url";
export const taskSelect =
  "id, workspace_id, title, description, status, due_date, due_time, assigned_member_id, verification_type, reward_points, template_id, created_by_member_id, evidence_url, evidence_text";
export const taskTemplateSelect =
  "id, workspace_id, title, description, assigned_member_id, verification_type, reward_points, rollover_enabled, repeat_type, repeat_weekdays, is_active, due_time";
export const rewardSelect =
  "id, workspace_id, title, description, requested_by_member_id, target_member_id, cost_points, status";
export const rewardTxSelect =
  "id, member_id, amount, transaction_type, source_type, source_id, memo, created_at";

export type MemberRole = "manager" | "member";

// ⚠️ 참여자 제한 인원. 원래 요구사항에 "제한 3명"이라고 하셨으니 3으로 고정했습니다.
const MAX_MEMBER_COUNT = 3;

type InviteAcceptResult = {
  workspace_id?: string;
  member_id?: string;
  status?: string;
};

type UseWorkspaceParams = {
  profile: Profile | null;
  loading: boolean;
  currentMonth: Date;
  setMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: ActiveTab) => void;
};

function generateInviteCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function useWorkspace({
  profile,
  loading,
  currentMonth,
  setMessage,
  setLoading,
  setActiveTab,
}: UseWorkspaceParams) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspacesLoaded, setWorkspacesLoaded] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");

  const [onboardingStep, setOnboardingStep] = useState<"choice" | "create" | "join">("choice");

  const [members, setMembers] = useState<Member[]>([]);
  const [workspacePlan, setWorkspacePlan] = useState<"free" | "premium">("free");
  const [memberBalances, setMemberBalances] = useState<Record<string, number>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardTransactions, setRewardTransactions] = useState<RewardTransaction[]>([]);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<MemberRole>("member");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteSuggestedName, setInviteSuggestedName] = useState("");
  const [pendingInvites, setPendingInvites] = useState<WorkspaceInvite[]>([]);
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState("");

  const currentMember = useMemo(() => {
    if (!profile) return null;
    return members.find((member) => member.profile_id === profile.id) || null;
  }, [members, profile]);

  const isManager =
    currentMember?.role === "owner" || currentMember?.role === "manager";

  const activeMembers = useMemo(
    () => members.filter((member) => member.status !== "removed"),
    [members]
  );

  useEffect(() => {
    if (currentMember) setMyNickname(currentMember.display_name);
  }, [currentMember?.id, currentMember?.display_name]);

  useEffect(() => {
    if (workspace?.id) loadWorkspaceData(workspace.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.id, currentMonth.getFullYear(), currentMonth.getMonth()]);

  useEffect(() => {
    if (!workspace) return;

    const channel = supabase
      .channel(`workspace-sync-${workspace.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_members", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_templates", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rewards", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reward_transactions", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_invites", filter: `workspace_id=eq.${workspace.id}` },
        () => loadWorkspaceData(workspace.id)
      )
      .subscribe(() => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspace?.id]);

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

  function resetWorkspaceState() {
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
    setNewMemberName("");
    setNewMemberRole("member");
    setInviteSuggestedName("");
    setPendingInvites([]);
    setJoinInviteCode("");
  }

  async function loadWorkspaces() {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, description")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`모임 조회 실패: ${error.message}`);
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
      return { ok: false, text: "프로필이 없습니다." };
    }
    if (!workspaceName.trim()) {
      setMessage("모임 이름을 입력해주세요.");
      return { ok: false, text: "모임 이름을 입력해주세요." };
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
      setMessage(`모임 생성 실패: ${workspaceError.message}`);
      setLoading(false);
      return { ok: false, text: `모임 생성 실패: ${workspaceError.message}` };
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
      return { ok: false, text: `owner 등록 실패: ${ownerError.message}` };
    }

    const newWorkspace = createdWorkspace as Workspace;
    setWorkspaces((prev) => [newWorkspace, ...prev]);
    setWorkspace(newWorkspace);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setActiveTab("settings");
    setMessage(`모임 생성 완료: ${newWorkspace.name}`);
    setLoading(false);
    return { ok: true, text: `모임 생성 완료: ${newWorkspace.name}` };
  }

  async function addVirtualMember() {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return { ok: false, text: "방장/부방장만 가능합니다." };
    }
    if (!newMemberName.trim()) {
      setMessage("이름을 입력해주세요.");
      return { ok: false, text: "이름을 입력해주세요." };
    }
    if (activeMembers.length + pendingInvites.length >= MAX_MEMBER_COUNT) {
      const text = `참여자 제한(최대 ${MAX_MEMBER_COUNT}명)에 도달하여 추가할 수 없습니다.`;
      setMessage(text);
      return { ok: false, text };
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
        requires_account: false,
        created_by: profile?.id || null,
      })
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`참여자 추가 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `참여자 추가 실패: ${error.message}` };
    }

    setMembers((prev) => [...prev, data as Member]);
    setNewMemberName("");
    setNewMemberRole("member");
    setMessage(`참여자 추가 완료: ${data.display_name}`);
    setLoading(false);
    return { ok: true, text: `참여자 추가 완료: ${data.display_name}` };
  }

  async function removeMember(member: Member) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return { ok: false, text: "방장/부방장만 가능합니다." };
    }
    if (member.role === "owner") {
      setMessage("owner는 제외할 수 없습니다.");
      return { ok: false, text: "owner는 제외할 수 없습니다." };
    }

    const confirmed = window.confirm(
      `${member.display_name}님을 제외하시겠습니까? 관련 기록은 유지됩니다.`
    );
    if (!confirmed) return { ok: false, text: "" };

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
      return { ok: false, text: `제외 실패: ${error.message}` };
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? { ...item, ...(data as Member) } : item)));
    setMessage(`${member.display_name}님을 제외했습니다.`);
    setLoading(false);
    return { ok: true, text: `${member.display_name}님을 제외했습니다.` };
  }

  async function restoreMember(member: Member) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return { ok: false, text: "방장/부방장만 가능합니다." };
    }
    if (activeMembers.length + pendingInvites.length >= MAX_MEMBER_COUNT) {
      const text = `참여자 제한(최대 ${MAX_MEMBER_COUNT}명)에 도달하여 복구할 수 없습니다.`;
      setMessage(text);
      return { ok: false, text };
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
      return { ok: false, text: `복구 실패: ${error.message}` };
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
    setMessage(`${member.display_name}님을 복구했습니다.`);
    setLoading(false);
    return { ok: true, text: `${member.display_name}님을 복구했습니다.` };
  }

  async function updateMemberRole(member: Member, newRole: "manager" | "member") {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (!isManager) {
      setMessage("방장/부방장만 권한을 조정할 수 있습니다.");
      return { ok: false, text: "방장/부방장만 권한을 조정할 수 있습니다." };
    }
    if (member.role === "owner") {
      setMessage("방장의 권한은 여기서 바꿀 수 없습니다.");
      return { ok: false, text: "방장의 권한은 여기서 바꿀 수 없습니다." };
    }
    if (member.role === newRole) return { ok: true, text: "" };

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", member.id)
      .select(memberSelect)
      .single();

    if (error) {
      setMessage(`권한 변경 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `권한 변경 실패: ${error.message}` };
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
    const text = `${member.display_name}님의 권한을 ${roleLabel(newRole)}로 변경했습니다.`;
    setMessage(text);
    setLoading(false);
    return { ok: true, text };
  }

  async function saveMyNickname() {
    if (!workspace || !currentMember) {
      setMessage("연결된 참여자가 없습니다.");
      return { ok: false, text: "연결된 참여자가 없습니다." };
    }

    const trimmed = myNickname.trim();
    if (!trimmed) {
      setMessage("닉네임을 입력해주세요.");
      return { ok: false, text: "닉네임을 입력해주세요." };
    }
    if (trimmed === currentMember.display_name) return { ok: true, text: "" };

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
      return { ok: false, text: `닉네임 변경 실패: ${error.message}` };
    }

    setMembers((prev) => prev.map((item) => (item.id === currentMember.id ? (data as Member) : item)));
    const text = `닉네임을 "${trimmed}"로 변경했습니다.`;
    setMessage(text);
    setLoading(false);
    return { ok: true, text };
  }

  async function transferOwnership(targetMember: Member) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (currentMember?.role !== "owner") {
      setMessage("owner만 넘길 수 있습니다.");
      return { ok: false, text: "owner만 넘길 수 있습니다." };
    }
    if (!targetMember.profile_id) {
      setMessage("계정이 연결된 참여자에게만 넘길 수 있습니다.");
      return { ok: false, text: "계정이 연결된 참여자에게만 넘길 수 있습니다." };
    }

    const confirmed = window.confirm(
      `${targetMember.display_name}에게 owner를 넘기시겠습니까? 기존 owner는 manager로 변경됩니다.`
    );
    if (!confirmed) return { ok: false, text: "" };

    setLoading(true);
    setMessage("");

    const { error } = await supabase.rpc("transfer_workspace_ownership", {
      target_workspace_id: workspace.id,
      new_owner_member_id: targetMember.id,
    });

    if (error) {
      setMessage(`방장 위임 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `방장 위임 실패: ${error.message}` };
    }

    await loadWorkspaceData(workspace.id);
    const text = `${targetMember.display_name}에게 owner를 넘겼습니다.`;
    setMessage(text);
    setLoading(false);
    return { ok: true, text };
  }

  async function deleteWorkspace(targetWorkspace: Workspace) {
    if (currentMember?.role !== "owner") {
      setMessage("방장만 삭제할 수 있습니다.");
      return { ok: false, text: "방장만 삭제할 수 있습니다." };
    }

    const confirmed = window.confirm(
      `"${targetWorkspace.name}"을 삭제하시겠습니까? 모든 할 일, 참여자, 보상 기록이 삭제되며 되돌릴 수 없습니다.`
    );
    if (!confirmed) return { ok: false, text: "" };

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("workspaces").delete().eq("id", targetWorkspace.id);

    if (error) {
      setMessage(`모임 삭제 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `모임 삭제 실패: ${error.message}` };
    }

    setWorkspaces((prev) => prev.filter((item) => item.id !== targetWorkspace.id));
    setWorkspace((prev) => (prev?.id === targetWorkspace.id ? null : prev));
    const text = `${targetWorkspace.name}을 삭제했습니다.`;
    setMessage(text);
    setLoading(false);

    await loadWorkspaces();
    return { ok: true, text };
  }

  // ⚠️ 재구성한 함수: 원본 파일에 본문이 존재하지 않아, 지금까지 논의된 요구사항
  // (방장/부방장만 발급, 참여자 3명 제한, {ok, text} 반환)에 맞춰 새로 작성했습니다.
  // 원래 코드에 초대코드 생성 방식이 따로 있었다면(예: RPC 호출 등) 반드시 알려주세요.
  async function createInvite() {
    if (!workspace) {
      const text = "모임이 없습니다.";
      setMessage(text);
      return { ok: false, text };
    }
    if (!isManager) {
      const text = "방장/부방장만 초대코드를 발급할 수 있습니다.";
      setMessage(text);
      return { ok: false, text };
    }
    if (activeMembers.length + pendingInvites.length >= MAX_MEMBER_COUNT) {
      const text = `참여자 제한(최대 ${MAX_MEMBER_COUNT}명)에 도달하여 더 이상 초대할 수 없습니다.`;
      setMessage(text);
      return { ok: false, text };
    }

    setLoading(true);
    setMessage("");

    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("workspace_invites")
      .insert({
        workspace_id: workspace.id,
        invite_code: code,
        role: inviteRole,
        suggested_name: inviteSuggestedName.trim() || null,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id, invite_code, role, suggested_name, status, expires_at")
      .single();

    if (error) {
      const text = `초대코드 발급 실패: ${error.message}`;
      setMessage(text);
      setLoading(false);
      return { ok: false, text };
    }

    setPendingInvites((prev) => [data as WorkspaceInvite, ...prev]);
    setInviteSuggestedName("");
    const text = `초대코드 발급 완료: ${data.invite_code}`;
    setMessage(text);
    setLoading(false);
    return { ok: true, text };
  }

  async function acceptInviteCode(codeOverride?: string) {
    const codeToUse = (codeOverride ?? joinInviteCode).trim();

    if (!codeToUse) {
      setMessage("초대코드를 입력해주세요.");
      return { ok: false, text: "초대코드를 입력해주세요." };
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.rpc("accept_workspace_invite", {
      input_code: codeToUse.toUpperCase(),
    });

    if (error) {
      setMessage(`참여 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `참여 실패: ${error.message}` };
    }

    setJoinInviteCode("");
    setMessage("참여 완료");

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
    return { ok: true, text: "참여 완료" };
  }

  async function cancelPendingInvite(invite: WorkspaceInvite) {
    if (!workspace) {
      setMessage("모임이 없습니다.");
      return { ok: false, text: "모임이 없습니다." };
    }
    if (!isManager) {
      setMessage("방장/부방장만 가능합니다.");
      return { ok: false, text: "방장/부방장만 가능합니다." };
    }

    const confirmed = window.confirm("이 초대코드를 취소할까요?");
    if (!confirmed) return { ok: false, text: "" };

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("workspace_invites")
      .update({ status: "cancelled" })
      .eq("id", invite.id)
      .eq("status", "pending");

    if (error) {
      setMessage(`초대코드 취소 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `초대코드 취소 실패: ${error.message}` };
    }

    setPendingInvites((prev) => prev.filter((item) => item.id !== invite.id));
    setMessage("초대코드를 취소했습니다.");
    setLoading(false);
    return { ok: true, text: "초대코드를 취소했습니다." };
  }

  async function loadWorkspaceData(workspaceId: string) {
    const { data: workspaceRow } = await supabase
      .from("workspaces")
      .select("created_by")
      .eq("id", workspaceId)
      .single();

    let plan: "free" | "premium" = "free";
    if (workspaceRow?.created_by) {
      const { data: premiumCheck } = await supabase.rpc("is_premium", {
        target_profile_id: workspaceRow.created_by,
      });
      plan = premiumCheck ? "premium" : "free";
    }
    setWorkspacePlan(plan);

    const { data: balanceRows } = await supabase.rpc("get_member_balances", {
      target_workspace_id: workspaceId,
    });
    const balanceMap: Record<string, number> = {};
    (balanceRows || []).forEach((row: { member_id: string; balance: number }) => {
      balanceMap[row.member_id] = row.balance;
    });
    setMemberBalances(balanceMap);

    const monthStart = toDateKey(startOfMonth(currentMonth));
    const monthEnd = toDateKey(endOfMonth(currentMonth));
    const thirtyDaysAgoKey = toDateKey(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [membersResult, tasksResult, templatesResult, rewardsResult, rewardTransactionsResult, invitesResult] = await Promise.all([
      supabase.from("workspace_members").select(memberSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
      (() => {
        let q = supabase.from("tasks").select(taskSelect).eq("workspace_id", workspaceId).gte("due_date", monthStart).lte("due_date", monthEnd);
        if (plan === "free") q = q.gte("due_date", thirtyDaysAgoKey);
        return q.order("due_date", { ascending: true });
      })(),
      supabase.from("task_templates").select(taskTemplateSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
      supabase.from("rewards").select(rewardSelect).eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
      (() => {
        let q = supabase.from("reward_transactions").select(rewardTxSelect).eq("workspace_id", workspaceId);
        if (plan === "free") q = q.gte("created_at", thirtyDaysAgoIso);
        return q.order("created_at", { ascending: true });
      })(),
      supabase.from("workspace_invites").select("id, invite_code, role, suggested_name, status, expires_at").eq("workspace_id", workspaceId).eq("status", "pending").order("created_at", { ascending: false }),
    ]);

    if (membersResult.error) {
      setMessage(`참여자 조회 실패: ${membersResult.error.message}`);
      return;
    }
    if (tasksResult.error) {
      setMessage(`할 일 조회 실패: ${tasksResult.error.message}`);
      return;
    }
    if (templatesResult.error) {
      setMessage(`반복 할 일 조회 실패: ${templatesResult.error.message}`);
      return;
    }
    if (rewardsResult.error) {
      setMessage(`보상 조회 실패: ${rewardsResult.error.message}`);
      return;
    }
    if (rewardTransactionsResult.error) {
      setMessage(`포인트 내역 조회 실패: ${rewardTransactionsResult.error.message}`);
      return;
    }
    if (invitesResult.error) {
      setMessage(`초대코드 조회 실패: ${invitesResult.error.message}`);
      return;
    }

    setMembers((membersResult.data || []) as Member[]);
    setTasks((tasksResult.data || []) as Task[]);
    setTemplates((templatesResult.data || []) as TaskTemplate[]);
    setRewards((rewardsResult.data || []) as Reward[]);
    setRewardTransactions((rewardTransactionsResult.data || []) as RewardTransaction[]);
    setPendingInvites((invitesResult.data || []) as WorkspaceInvite[]);
  }

  function balanceByMemberId(memberId: string) {
    return memberBalances[memberId] ?? 0;
  }

  return {
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
    workspacePlan,
    memberBalances,
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
  };
}
