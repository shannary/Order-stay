import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  tables: { number: number } | null;
  order_items: Array<{
    item_name: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
  }> | null;
};

/**
 * GET /api/admin/orders?queue=pending|kitchen
 * Satu pintu baca untuk dashboard kasir & dapur (service role).
 *  - pending  → payment_status='pending'  (antrean kasir)
 *  - kitchen  → payment_status='paid' AND status IN received/cooking/served
 *
 * Penyapuan otomatis: order tunai PENDING lebih dari 60 menit tanpa
 * validasi kasir dihapus ("tidak jadi"). Berjalan tiap refresh kasir
 * sehingga tidak perlu cron terpisah.
 * Auth: requireAdminUser (whitelist env ADMIN_EMAILS).
 */
export async function GET(request: NextRequest) {
  const user = await requireAdminUser(request);
  if (!user) return unauthorized();

  const queue = request.nextUrl.searchParams.get("queue") ?? "pending";
  const supabase = getSupabaseServerClient();

  // ---- SWEEP order tunai basi (>60 menit) ----
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await supabase
    .from("orders")
    .delete()
    .eq("payment_method", "cash")
    .eq("payment_status", "pending")
    .eq("status", "received")
    .lt("created_at", cutoff);

  if (queue === "kitchen") {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, total_amount, created_at, tables(number), order_items(item_name, quantity, unit_price, notes)"
      )
      .eq("payment_status", "paid")
      .in("status", ["received", "cooking", "served"])
      .order("created_at", { ascending: true })
      .limit(60);

    if (error) {
      return Response.json({ error: "Gagal memuat antrean" }, { status: 500 });
    }
    return Response.json({
      orders: data as unknown as OrderRow[],
    });
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, payment_method, total_amount, created_at, tables(number), order_items(count)"
    )
    .eq("payment_status", "pending")
    .order("created_at", { ascending: true })
    .limit(60);

  if (error) {
    return Response.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
  return Response.json({
    orders: data as unknown as OrderRow[],
  });
}
