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
