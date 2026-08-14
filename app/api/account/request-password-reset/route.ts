import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminEmail } from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const userMessage = typeof body?.message === "string" ? body.message.trim() : "";

  if (!username) {
    return NextResponse.json({ error: "USERNAME_REQUIRED" }, { status: 400 });
  }
  if (userMessage.length > 1000) {
    return NextResponse.json({ error: "MESSAGE_TOO_LONG" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: userListData } = await admin.auth.admin.listUsers();
  const matchedAuthUser = userListData?.users.find((user) => {
    const localPart = user.email?.split("@")[0];
    return localPart?.toLowerCase() === username.toLowerCase();
  });

  let accountInfo = "해당 아이디의 계정을 찾을 수 없습니다.";
  if (matchedAuthUser) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, recovery_email, created_at")
      .eq("auth_user_id", matchedAuthUser.id)
      .maybeSingle();

    accountInfo = [
      `표시 이름: ${profile?.display_name || "(없음)"}`,
      `복구 이메일: ${profile?.recovery_email || "(등록 안 함)"}`,
      `가입일: ${matchedAuthUser.created_at}`,
      `auth_user_id: ${matchedAuthUser.id}`,
    ].join("\n");
  }

  const subject = `[미루지] 비밀번호 재설정 요청 - ${username}`;
  const text = [
    `요청 시각: ${new Date().toLocaleString("ko-KR")}`,
    `요청 아이디: ${username}`,
    "",
    "[계정 정보]",
    accountInfo,
    "",
    "[사용자 작성 내용]",
    userMessage || "(작성 안 함)",
  ].join("\n");

  const result = await sendAdminEmail({ subject, text });

  if (!result.ok) {
    return NextResponse.json({ error: "SEND_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
