import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAuthUser } from "@/lib/auth-route";

/**
 * Konfirmasi pembayaran tunai oleh kasir.
 * Service role + server-side guard (masih lokal) → update payment_status='paid',
 * yang memicu trigger auto-approve → pesanan masuk antrean dapur,
 * lalu tersebar realtime ke HP pelanggan & dashboard lain.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireAuthUser(_request);
  if (!user) {
    return Response.json(
      { error: "Akses ditolak — kredensial kasir tidak valid" },
      { status: 401 }
    );
  }
  // TODO: tambahkan role-based check (tabel staff/profiles) sebelum produksi
  const { orderId } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "orderId tidak valid" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending") // idempotent: hanya mengubah pending
    .select("id, order_number, payment_status, is_approved")
    .single();

  if (error || !data) {
    return Response.json(
      { error: "Pesanan tidak ditemukan atau sudah dibayar" },
      { status: 404 }
    );
  }

  return Response.json({
    orderId: data.id,
    orderNumber: data.order_number,
    paymentStatus: data.payment_status,
    isApproved: data.is_approved, // true via trigger auto-approve
  });
}
