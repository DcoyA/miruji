"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/app";

export type AuthMode = "signin" | "signup" | "forgot";

const FAKE_EMAIL_DOMAIN = "users.miruji.app";

const profileSelect =
  "id, auth_user_id, display_name, avatar_url, onboarding_completed, recovery_email";

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@${FAKE_EMAIL_DOMAIN}`;
}

type UseAuthParams = {
  setMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;
};

export function useAuth({ setMessage, setLoading }: UseAuthParams) {
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authUsername, setAuthUsername] = useState("");
  const [authRecoveryEmail, setAuthRecoveryEmail] = useState("");
  const [isHuman, setIsHuman] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(true);
  const [authPassword, setAuthPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileRecoveryEmail, setProfileRecoveryEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    initializeAuth();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      await loadProfile(session.user.id);
      setAuthLoading(false);
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("miruji_saved_username");
    if (saved) setAuthUsername(saved);
  }, []);

  useEffect(() => {
    if (profile) setProfileRecoveryEmail(profile.recovery_email || "");
  }, [profile?.id, profile?.recovery_email]);

  async function initializeAuth() {
    setAuthLoading(true);
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setProfile(null);
      setAuthLoading(false);
      return;
    }

    await loadProfile(data.user.id);
    setAuthLoading(false);
  }

  async function loadProfile(authUserId: string): Promise<Profile | null> {
    const { data: userData } = await supabase.auth.getUser();
    const meta = (userData.user?.user_metadata || {}) as {
      username?: string;
      recovery_email?: string;
    };
    const fallbackName = meta.username || userData.user?.email?.split("@")[0] || "";

    const { data, error } = await supabase
      .from("profiles")
      .select(profileSelect)
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (error) {
      setMessage(`프로필 조회 실패: ${error.message}`);
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
        username: meta.username || null,
        recovery_email: meta.recovery_email || null,
        onboarding_completed: false,
      })
      .select(profileSelect)
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
      .select(profileSelect)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  }

  async function signUp() {
    const trimmedUsername = authUsername.trim();

    if (!trimmedUsername || !authPassword.trim()) {
      setMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      setMessage("아이디는 영문, 숫자, 밑줄(_)만 3~20자로 입력해주세요.");
      return;
    }
    if (authPassword.trim().length < 6) {
      setMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (authRecoveryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authRecoveryEmail.trim())) {
      setMessage("복구용 이메일 형식이 올바르지 않습니다.");
      return;
    }
    if (!agreedToTerms) {
      setMessage("이용약관에 동의해주세요.");
      return;
    }
    if (!isHuman) {
      setMessage("사람입니다 체크를 해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: availability, error: availabilityError } = await supabase.rpc(
      "is_username_available",
      { check_username: trimmedUsername }
    );

    if (availabilityError) {
      setMessage(`아이디 확인 실패: ${availabilityError.message}`);
      setLoading(false);
      return;
    }
    if (availability === false) {
      setMessage("이미 사용 중인 아이디입니다.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(trimmedUsername),
      password: authPassword.trim(),
      options: {
        data: {
          username: trimmedUsername,
          display_name: trimmedUsername,
          recovery_email: authRecoveryEmail.trim() || null,
        },
      },
    });

    if (error) {
      console.error("signUp error", error);
      setMessage(`가입 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    const isAlreadyRegistered = data.user && (data.user.identities?.length ?? 0) === 0;
    if (isAlreadyRegistered) {
      setMessage("이미 가입된 아이디입니다. 로그인해주세요.");
      setLoading(false);
      return;
    }

    if (rememberUsername) {
      window.localStorage.setItem("miruji_saved_username", trimmedUsername);
    }

    setMessage("가입 완료되었습니다.");
    setLoading(false);
  }

  async function signIn() {
    const trimmedUsername = authUsername.trim();

    if (!trimmedUsername || !authPassword.trim()) {
      setMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(trimmedUsername),
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

    if (rememberUsername) {
      window.localStorage.setItem("miruji_saved_username", trimmedUsername);
    } else {
      window.localStorage.removeItem("miruji_saved_username");
    }

    const loadedProfile = await loadProfile(data.user.id);
    if (loadedProfile) {
      setMessage("로그인 성공");
    }
    setLoading(false);
  }

  async function requestPasswordReset(customMessage: string, contactEmail: string) {
    const trimmedUsername = authUsername.trim();
    const trimmedContactEmail = contactEmail.trim();
  
    if (!trimmedUsername) {
      setMessage("아이디를 입력해주세요.");
      return;
    }
    if (!trimmedContactEmail) {
      setMessage("답장 받을 이메일 주소를 입력해주세요.");
      return;
    }
  
    setLoading(true);
    setMessage("");
  
    const response = await fetch("/api/account/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: trimmedUsername,
        message: customMessage,
        contactEmail: trimmedContactEmail,
      }),
    });
  
    if (!response.ok) {
      setMessage("요청 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setLoading(false);
      return;
    }
  
    setMessage("요청이 접수되었습니다. 입력하신 이메일로 안내드릴게요.");
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

    // 여기서 워크스페이스 상태를 직접 초기화하지 않습니다.
    // profile을 null로 만들면 page.tsx의 감시용 useEffect가 resetWorkspaceState를 호출합니다.
    setProfile(null);
    setAuthPassword("");
    setAuthMode("signin");
    setLoading(false);
    setMessage("");
  }

  async function saveRecoveryEmail() {
    if (!profile) return { ok: false, text: "프로필 정보를 불러오지 못했습니다." };

    const trimmed = profileRecoveryEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage("올바른 이메일 형식이 아닙니다.");
      return { ok: false, text: "올바른 이메일 형식이 아닙니다." };
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .update({ recovery_email: trimmed || null })
      .eq("id", profile.id)
      .select(profileSelect)
      .single();

    if (error) {
      setMessage(`이메일 저장 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `이메일 저장 실패: ${error.message}` };
    }

    setProfile(data as Profile);
    setMessage("복구용 이메일을 저장했습니다.");
    setLoading(false);
    return { ok: true, text: "복구용 이메일을 저장했습니다." };
  }

  async function changePassword() {
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setMessage("비밀번호는 6자 이상이어야 합니다.");
      return { ok: false, text: "비밀번호는 6자 이상이어야 합니다." };
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });

    if (error) {
      setMessage(`비밀번호 변경 실패: ${error.message}`);
      setLoading(false);
      return { ok: false, text: `비밀번호 변경 실패: ${error.message}` };
    }

    setNewPassword("");
    setMessage("비밀번호를 변경했습니다.");
    setLoading(false);
    return { ok: true, text: "비밀번호를 변경했습니다." };
  }

  async function deleteAccount() {
    const confirmed = window.confirm("정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.");
    if (!confirmed) return { ok: false, text: "" };

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("세션을 확인할 수 없습니다.");
      setLoading(false);
      return { ok: false, text: "세션을 확인할 수 없습니다." };
    }

    const response = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const result = await response.json();

    if (!response.ok) {
      const text =
        result.error === "SOLE_OWNER"
          ? "owner인 모임이 있어 탈퇴할 수 없습니다. 먼저 방장을 다른 사람에게 넘기거나 모임을 삭제해주세요."
          : "탈퇴에 실패했습니다. 다시 시도해주세요.";
      setMessage(text);
      setLoading(false);
      return { ok: false, text };
    }

    await supabase.auth.signOut();
    setMessage("탈퇴 처리되었습니다.");
    setLoading(false);
    return { ok: true, text: "탈퇴 처리되었습니다." };
  }

  async function uploadAvatar(file: File) {
    if (!profile) return { ok: false, text: "프로필 정보를 불러오지 못했습니다." };
  
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { ok: false, text: "jpg, png, webp, gif 형식만 업로드할 수 있습니다." };
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, text: "파일 크기는 5MB 이하여야 합니다." };
    }
  
    setLoading(true);
    setMessage("");
  
    const { data: userData } = await supabase.auth.getUser();
    const authUserId = userData.user?.id;
    if (!authUserId) {
      setLoading(false);
      return { ok: false, text: "로그인 정보를 확인할 수 없습니다." };
    }
  
    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${authUserId}/avatar.${ext}`;
  
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, cacheControl: "3600" });
  
    if (uploadError) {
      setLoading(false);
      const text = `업로드 실패: ${uploadError.message}`;
      setMessage(text);
      return { ok: false, text };
    }
  
    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    // 뒤에 타임스탬프를 붙여서, 사진을 바꿔도 브라우저 캐시 때문에 예전 사진이 계속 보이는 문제를 방지합니다.
    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
  
    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", profile.id)
      .select(profileSelect)
      .single();
  
    if (error) {
      setLoading(false);
      const text = `프로필 업데이트 실패: ${error.message}`;
      setMessage(text);
      return { ok: false, text };
    }

    await supabase.from("workspace_members").update({ avatar_url: avatarUrl }).eq("profile_id", profile.id);
    
    setProfile(data as Profile);
    setLoading(false);
    const text = "프로필 사진을 변경했습니다.";
    setMessage(text);
    return { ok: true, text };
  }
  
  return {
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
  };
}
