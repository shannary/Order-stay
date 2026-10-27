import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

/**
 * POST /api/admin/orders/[orderId]/complete
 * Dapur menandai pesanan selesai → status='completed', completed_at dicatat.
 * Dipakai KDS. (Menuju 'completed' berarti pesanan tuntas disajikan.)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireAdminUser(request);
  if (!user) return unauthorized();

  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "orderId tidak valid" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("payment_status", "paid") // hanya pesanan lunas
    .select("id")
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "Gagal menandai selesai" },
      { status: 500 }
    );
  }
  if (!data) {
    return Response.json(
      { error: "Pesanan tidak ada / belum dibayar" },
      { status: 409 }
    );
  }

  return Response.json({ ok: true });
}
