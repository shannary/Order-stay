import { NextRequest } from "next/server";
import { attemptLogin } from "@/lib/admin-login";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/admin/login
 * Autentikasi admin via Supabase Auth (attemptLogin TIDAK pernah lempar
 * exception → selalu JSON dengan status tepat). Diproteksi brute-force
 * dengan rate limit 5 percobaan / 15 menit per (IP, email).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Payload tidak valid" },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const emailKey = email.slice(0, 120);

  const ipKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`login:${ipKey}:${emailKey}`, 5, 15 * 60 * 1000)) {
    return Response.json(
      { error: "Terlalu banyak percobaan login — tunggu 15 menit" },
      { status: 429 }
    );
  }

  const result = await attemptLogin(
    email,
    body.password ?? "",
    body.pin ?? ""
  );

  if (!result.ok) {
    return Response.json(
      { error: result.error, hint: result.hint },
      { status: result.status }
    );
  }
  return Response.json({ ok: true });
}
