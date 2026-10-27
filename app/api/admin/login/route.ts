import { NextRequest, NextResponse } from "next/server";
import { handleLogin } from "@/lib/admin-login";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Response "wadah" tempat cookies auth ditulis oleh helper handleLogin
  const holder = NextResponse.json({});

  // baca body SEKALI (rate-limit + login memakai sumber yang sama)
  const raw = await request.text();

  let emailKey = "unknown";
  try {
    const peek = JSON.parse(raw) as { email?: string };
    emailKey = (peek.email ?? "").toLowerCase().slice(0, 120);
  } catch {
    // payload invalid → biarkan helper yang menolak
  }
  const ipKey =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`login:${ipKey}:${emailKey}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login — tunggu 15 menit" },
      { status: 429 }
    );
  }

  const clone = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: raw,
  });
  return handleLogin(clone, holder);
}
