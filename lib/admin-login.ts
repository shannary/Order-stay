import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/login  { email, password }
 * Login dilakukan SERVER-SIDE (bukan SDK client) supaya:
 *  - session cookie di-set oleh server → proxy.ts langsung valid
 *  - tidak ada ambiguitas Cache Components/SSR pada client SDK
 *  - whitelist ADMIN_EMAILS ditegakkan di awal (fail-closed)
 */
export async function handleLogin(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { error: "Konfigurasi Supabase belum lengkap di server" },
      { status: 500 }
    );
  }

  const whitelist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (whitelist.length === 0) {
    return NextResponse.json(
      { error: "ADMIN_EMAILS belum disetel — login admin dinonaktifkan" },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan kata sandi wajib diisi" },
      { status: 400 }
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email) {
    // pesan generik — jangan bocorkan apakah email terdaftar
    return NextResponse.json(
      { error: "Email atau kata sandi salah" },
      { status: 401 }
    );
  }

  if (!whitelist.includes(data.user.email.toLowerCase())) {
    // login valid TAPI bukan admin → langsung dikeluarkan
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Akun ini bukan admin kasir" },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
