import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

/**
 * POST /api/admin/orders/[orderId]/pay
 * Kasir mengonfirmasi pembayaran tunai → payment_status='paid',
 * is_approved=true (gerbang dapur terbuka), paid_at dicatat.
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

  // Update dengan guard pending → idempotent & anti race dengan webhook
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      is_approved: true,
      paid_at: new Date().toISOString(),
      status: "received",
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .eq("payment_method", "cash")
    .select("id")
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "Gagal mengonfirmasi pembayaran" },
      { status: 500 }
    );
  }
  if (!data) {
    return Response.json(
      { error: "Pesanan tidak ada / sudah diproses" },
      { status: 409 }
    );
  }

  return Response.json({ ok: true });
}
