import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

/**
 * POST /api/orders/[orderId]/cancel
 * Pembatalan pesanan:
 *  - Pelanggan: WAJIB cookie table_id cocok dengan order DAN masih pending
 *    (belum dibayar / belum di-approve masuk dapur).
 *  - Kasir/admin: boleh batalkan semua order yang masih pending.
 * Order dihapus beserta order_items (cascade).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "orderId tidak valid" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const admin = await requireAdminUser(request);

  // Ambil order untuk cek status + pemilik sesi
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, order_number, table_id, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !order) {
    return Response.json(
      { error: "Pesanan tidak ditemukan" },
      { status: 404 }
    );
  }

  const o = order as {
    id: string;
    order_number: string;
    table_id: string;
    status: string;
    payment_status: string;
  };

  const isPending =
    o.payment_status === "pending" &&
    ["received"].includes(o.status);

  if (!isPending) {
    return Response.json(
      // Sudah dibayar / sedang dimasak → tidak boleh dibatalkan dari sisi ini
      { error: "Pesanan sudah diproses — tidak dapat dibatalkan" },
      { status: 409 }
    );
  }

  if (!admin) {
    // Pelanggan: validasi sesi meja dengan cookie
    const sessionTable = request.cookies.get("table_id")?.value;
    if (!sessionTable || sessionTable !== o.table_id) {
      return unauthorized();
    }
  }

  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("payment_status", "pending"); // idempotent guard

  if (deleteError) {
    return Response.json(
      { error: "Gagal membatalkan pesanan" },
      { status: 500 }
    );
  }

  return Response.json({
    cancelled: true,
    orderNumber: o.order_number,
  });
}
