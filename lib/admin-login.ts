import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type LoginResult = { ok: true } | { ok: false; status: number; error: string; hint?: string };

/**
 * Proses login admin (server-side). Keamanan ganda:
 *   Layer 1 — Supabase Auth (email + kata sandi, sesi cookie httpOnly).
 *   Layer 2 — PIN admin (env ADMIN_PIN, diverifikasi SERVER-SIDE; tidak
 *             pernah dikirim ke browser kecuali hasil verifikasi).
 * whitelist email opsional (ADMIN_EMAILS) bila ingin membatasi kandidat.
 * Dipanggil dari route handler /api/admin/login.
 * TIDAK PERNAH melempar exception — selalu mengembalikan LoginResult.
 */
export async function attemptLogin(
  emailRaw: string,
  password: string,
  pin: string
): Promise<LoginResult> {
  const dev = process.env.NODE_ENV !== "production";
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      // Diagnostik env BOLEH tampil di produksi — tidak membocorkan nilai.
      const missing = [
        !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
        !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
      ].filter(Boolean);
      return {
        ok: false,
        status: 500,
        error: `Konfigurasi server belum lengkap: ${missing.join(", ")} tidak tersedia di ${dev ? ".env.local" : "environment deployment (Vercel)"}`,
        hint: dev
          ? "Isi variabel di .env.local, lalu restart server."
          : "Vercel: Project → Settings → Environment Variables → tambahkan variabel tsb untuk Production, lalu Redeploy.",
      };
    }

    // Whitelist opsional: hanya filter bila ADMIN_EMAILS diisi.
    const whitelist = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

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
      // Log server penuh untuk Vercel logs; klien hanya pesan rapi.
      console.error("[attemptLogin] supabase auth error:", error?.message);
      return { ok: false, status: 401, error: "Email atau kata sandi salah" };
    }

    if (
      whitelist.length > 0 &&
      !whitelist.includes(data.user.email.toLowerCase())
    ) {
      // sah tapi bukan admin → keluarkan langsung
      await supabase.auth.signOut();
      return { ok: false, status: 403, error: "Akun ini bukan admin kasir" };
    }

    // Layer 2: PIN admin (server-side). Bingkai: pesan generik agar
    // tidak konsisten terlihat mana layer yang gagal (katalis probing).
    const adminPin = (process.env.ADMIN_PIN ?? "").trim();
    if (!adminPin) {
      return {
        ok: false,
        status: 503,
        error: "AKSES ADMIN BELUM AKTIF — set ADMIN_PIN dulu",
        hint: dev
          ? "Tambahkan ADMIN_PIN=<6 digit> di .env.local, lalu restart; di Vercel tambahkan di Environment Variables lalu Redeploy."
          : "Vercel: Settings → Environment Variables → ADMIN_PIN → Redeploy.",
      };
    }
    if (pin.trim() !== adminPin) {
      // Keluarkan sesi agar kombinasi (email benar, PIN salah) tak menyisakan
      // sesi setengah-jalan
      await supabase.auth.signOut();
      return {
        ok: false,
        status: 401,
        error: "PIN admin salah",
      };
    }

    return { ok: true };
  } catch (err) {
    console.error("[attemptLogin][unexpected]", err);
    return {
      ok: false,
      status: 500,
      error: dev
        ? `Kesalahan tak terduga saat login: ${String((err as Error)?.message ?? err)}`
        // Produksi: sebutkan kategori error agar bisa ditindak, tanpa detail internal
        : "Kesalahan tak terduga saat login — cek Vercel Function Logs.",
      hint: dev ? undefined : "Vercel: Project → Deployments → Logs → cari [attemptLogin]",
    };
  }
}
