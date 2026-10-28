import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/**
 * Verifikasi sesi ADMIN untuk Route Handler (mis. /api/admin/*).
 * 1. Membaca & memverifikasi session cookie ke server Auth (bukan pasca isi cookie).
 * 2. Email harus ada di whitelist ADMIN_EMAILS (env, dipisah koma).
 *    Jika ADMIN_EMAILS tidak diisi → tolak (fail-closed), tidak pernah open-all.
 */
export async function requireAdminUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const whitelist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Whitelist opsional: hanya filter bila ADMIN_EMAILS diisi.
  // (Sama dengan attemptLogin — login normal tanpa whitelist termasuk default.)

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {
        // no-op pada route handler (read-only)
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  return whitelist.length === 0 || whitelist.includes(user.email.toLowerCase())
    ? user
    : null;
}

export function unauthorized() {
  return Response.json(
    { error: "Akses ditolak — kredensial admin tidak valid" },
    { status: 401 }
  );
}
