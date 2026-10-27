import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type LoginResult = { ok: true } | { ok: false; status: number; error: string; hint?: string };

/**
 * Proses login admin (server-side).
 * Dipanggil dari route handler /api/admin/login.
 * TIDAK PERNAH melempar exception — selalu mengembalikan LoginResult.
 */
export async function attemptLogin(
  emailRaw: string,
  password: string
): Promise<LoginResult> {
  const dev = process.env.NODE_ENV !== "production";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return {
        ok: false,
        status: 500,
        error: "Konfigurasi Supabase belum lengkap di server",
        hint: dev
          ? "Isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local, lalu restart server."
          : undefined,
      };
    }

    const whitelist = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (whitelist.length === 0) {
      return {
        ok: false,
        status: 503,
        error: "Login admin nonaktif — ADMIN_EMAILS belum disetel",
        hint: dev
          ? 'Tambah di .env.local baris: ADMIN_EMAILS=youradmin@yourcafe.id — email harus SAMA dengan user Supabase Auth, lalu restart.'
          : undefined,
      };
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          for (const { name, value, options } of cookies) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailRaw.trim().toLowerCase(),
      password,
    });

    if (error || !data.user?.email) {
      return { ok: false, status: 401, error: "Email atau kata sandi salah" };
    }

    if (!whitelist.includes(data.user.email.toLowerCase())) {
      // sah tapi bukan admin → keluarkan langsung
      await supabase.auth.signOut();
      return { ok: false, status: 403, error: "Akun ini bukan admin kasir" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[attemptLogin][unexpected]", err);
    return {
      ok: false,
      status: 500,
      error: "Kesalahan tak terduga saat login",
      hint: dev ? `detail: ${String((err as Error)?.message ?? err)}` : undefined,
    };
  }
}
