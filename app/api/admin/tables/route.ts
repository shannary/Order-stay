import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

type AdminTable = {
  id: string;
  number: number;
  label: string | null;
  qr_token: string;
  is_active: boolean;
  capacity: number;
};

/** GET /api/admin/tables — daftar meja milik admin (termasuk qr_token). */
export async function GET(request: NextRequest) {
  const user = await requireAdminUser(request);
  if (!user) return unauthorized();

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tables")
    .select("id, number, label, qr_token, is_active, capacity")
    .order("number", { ascending: true });

  if (error) {
    return Response.json({ error: "Gagal memuat meja" }, { status: 500 });
  }
  return Response.json({ tables: (data ?? []) as AdminTable[] });
}

/**
 * POST /api/admin/tables — tambah meja baru.
 * qr_token dibuat server: `t_` + 12 karakter acak (unik) →
 * token tanpa ketebalan menu tak bisa ditebak.
 */
export async function POST(request: NextRequest) {
  const user = await requireAdminUser(request);
  if (!user) return unauthorized();

  let body: { number?: number; label?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const number = Number(body.number);
  if (!Number.isInteger(number) || number < 1 || number > 9999) {
    return Response.json(
      { error: "Nomor meja harus bilangan 1–9999" },
      { status: 400 }
    );
  }
  const label = (body.label ?? "").trim().slice(0, 50) || null;

  const randomToken = () =>
    `t_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const supabase = getSupabaseServerClient();

  // Coba 3x bila tabrakan token (sangat tidak mungkin)
  let lastError: unknown = null;
  for (let i = 0; i < 3; i++) {
    const { data, error } = await supabase
      .from("tables")
      .insert({
        number,
        label,
        qr_token: randomToken(),
      })
      .select("id, number, label, qr_token, is_active, capacity")
      .single();

    if (!error) {
      return Response.json({ table: data as AdminTable }, { status: 201 });
    }
    lastError = error;
  }

  const message = String(lastError);
  if (message.includes("unique")) {
    return Response.json(
      { error: `Nomor meja ${number} sudah terdaftar` },
      { status: 409 }
    );
  }
  return Response.json({ error: "Gagal menambah meja" }, { status: 500 });
}
