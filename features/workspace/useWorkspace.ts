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
      return { ok: false, text: `제외 실패: ${error.message}` };
    }

    setMembers((prev) => prev.map((item) => (item.id === member.id ? (data as Member) : item)));
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
    if (member.role === newRole) return;

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
    if (!confirmed) return;

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
    if (!confirmed) return;

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
    if (!confirmed) return;

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
