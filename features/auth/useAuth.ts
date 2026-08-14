"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types/app";

export type AuthMode = "signin" | "signup" | "forgot";

// ⚠️ 실제 값 확인 필요: 원본 page.tsx에 이 상수의 선언부가 보이지 않았습니다.
// 저장소에서 `FAKE_EMAIL_DOMAIN` 을 검색해 실제 문자열로 반드시 교체하세요.
// 잘못된 값을 넣으면 기존 가입자 전원이 로그인할 수 없게 됩니다.
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
  // ⚠️ authLoading=true, authMode="signin", rememberUsername=false 는
  // 원본에 선언부가 없어 동작 패턴으로 추정한 초기값입니다. 실제 의도와 다르면 알려주세요.
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

  async function requestPasswordReset() {
    if (!authRecoveryEmail.trim()) {
      setMessage("등록된 복구 이메일이 없습니다. 관리자에게 문의해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const appUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://miruji-omega.vercel.app";

    const { error } = await supabase.auth.resetPasswordForEmail(authRecoveryEmail.trim(), {
      redirectTo: `${appUrl}/auth/reset`,
    });

    if (error) {
      console.error("resetPasswordForEmail error", error);
      const detail =
        error.message && error.message.trim() && error.message !== "{}"
          ? error.message
          : `오류 코드: ${(error as any).status ?? error.name ?? "알수없음"}`;
      setMessage(`재설정 요청 실패: ${detail}`);
      setLoading(false);
      return;
    }

    setMessage("재설정 메일을 보냈습니다. 메일함을 확인해주세요.");
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

  async function deleteAccount() {
    const confirmed = window.confirm("정말 탈퇴하시겠습니까? 되돌릴 수 없습니다.");
    if (!confirmed) return;

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      setMessage("세션을 확인할 수 없습니다.");
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
          "owner인 모임이 있어 탈퇴할 수 없습니다. 먼저 방장을 다른 사람에게 넘기거나 모임을 삭제해주세요."
        );
      } else {
        setMessage("탈퇴에 실패했습니다. 다시 시도해주세요.");
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setMessage("탈퇴 처리되었습니다.");
    setLoading(false);
  }

  async function saveRecoveryEmail() {
    if (!profile) return;

    const trimmed = profileRecoveryEmail.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setMessage("올바른 이메일 형식이 아닙니다.");
      return;
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
      return;
    }

    setProfile(data as Profile);
    setMessage("복구용 이메일을 저장했습니다.");
    setLoading(false);
  }

  async function changePassword() {
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setMessage("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });

    if (error) {
      setMessage(`비밀번호 변경 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setNewPassword("");
    setMessage("비밀번호를 변경했습니다.");
    setLoading(false);
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
  };
}
