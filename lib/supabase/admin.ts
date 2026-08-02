import { createClient } from "@supabase/supabase-js";

// 이 클라이언트는 서버(API 라우트)에서만 사용해야 합니다.
// "use client" 컴포넌트나 브라우저에서 절대 import하지 마세요.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
