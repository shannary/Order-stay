import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/**
 * Verifikasi pengguna terautentikasi untuk Route Handler (mis. /api/admin/*).
 * Membaca session cookie via @supabase/ssr dan memverifikasi ke Auth server.
 * Read-only: pembaruan token refresh tetap di-proxy halaman halaman.
 */
export async function requireAuthUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        // no-op pada read-only route handler
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
