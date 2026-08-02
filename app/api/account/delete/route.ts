import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "INVALID_AUTH" }, { status: 401 });
  }

  const authUserId = userData.user.id;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id")
    .eq("auth_user_id", authUserId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const profileId = profile.id;

  const { data: myMemberships, error: membershipError } = await admin
    .from("workspace_members")
    .select("id, workspace_id, role")
    .eq("profile_id", profileId)
    .eq("status", "active");

  if (membershipError) {
    return NextResponse.json({ error: "MEMBERSHIP_LOOKUP_FAILED" }, { status: 500 });
  }

  const blockedWorkspaceIds: string[] = [];

  for (const membership of myMemberships || []) {
    if (membership.role !== "owner" && membership.role !== "manager") continue;

    const { data: otherManagers, error: othersError } = await admin
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", membership.workspace_id)
      .eq("status", "active")
      .in("role", ["owner", "manager"])
      .neq("id", membership.id);

    if (othersError) {
      return NextResponse.json({ error: "MANAGER_CHECK_FAILED" }, { status: 500 });
    }

    if (!otherManagers || otherManagers.length === 0) {
      blockedWorkspaceIds.push(membership.workspace_id);
    }
  }

  if (blockedWorkspaceIds.length > 0) {
    return NextResponse.json(
      { error: "SOLE_OWNER", workspaceIds: blockedWorkspaceIds },
      { status: 409 }
    );
  }

  await admin
    .from("workspace_members")
    .update({ status: "left", profile_id: null })
    .eq("profile_id", profileId);

  await admin.from("profiles").delete().eq("id", profileId);

  const { error: deleteError } = await admin.auth.admin.deleteUser(authUserId);

  if (deleteError) {
    return NextResponse.json({ error: "AUTH_DELETE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
