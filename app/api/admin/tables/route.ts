import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

/**
 * Admin CRUD meja (service role — bypass RLS).
 * GET  → daftar semua meja (termasuk non-aktif)
 * POST → buat meja baru dengan qr_token unik otomatis
 */
export async function GET(request: NextRequest) {
  const user = await requireAdminUser(request);
  if (!user) {
    return Response.json(
      { error: "Akses ditolak — harus login admin" },
      { status: 401 }
    );
  }
  // TODO: tambahkan role-based check (tabel staff/profiles) sebelum produksi
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tables")
    .select("id, number, label, qr_token, is_active, capacity")
    .order("number", { ascending: true });

  if (error) {
    return Response.json({ error: "Gagal memuat meja" }, { status: 500 });
  }
  return Response.json({ tables: data });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    number?: number;
    label?: string;
    capacity?: number;
  };

  if (
    !Number.isInteger(body.number) ||
    (body.number as number) < 1 ||
    (body.number as number) > 9999
  ) {
    return Response.json(
      { error: "Nomor meja harus antara 1–9999" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // qr_token unik: "t_" + 20 karakter acak URL-safe
  const qrToken = `t_${Array.from(crypto.getRandomValues(new Uint8Array(15)))
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 20)}`;

  const { data, error } = await supabase
    .from("tables")
    .insert({
      number: body.number,
      label: body.label?.trim() || null,
      capacity: body.capacity ?? 4,
      qr_token: qrToken,
      is_active: true,
    })
    .select("id, number, label, qr_token, is_active, capacity")
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "Nomor meja sudah dipakai" },
        { status: 409 }
      );
    }
    return Response.json({ error: "Gagal menambah meja" }, { status: 500 });
  }

  return Response.json({ table: data }, { status: 201 });
}
