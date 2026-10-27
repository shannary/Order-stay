import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdminUser, unauthorized } from "@/lib/auth-route";

/**
 * POST /api/admin/orders/[orderId]/complete
 * Kasir/dapur menandai pesanan LUNAS sebagai completed.
 * Menolak pesanan yang belum dibayar → KDS hanya memproses yg sudah paid.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await requireAdminUser(request);
  if (!user) {
    return Response.json(
      { error: "Akses ditolak — harus login admin" },
      { status: 401 }
    );
  }

  const { orderId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "orderId tidak valid" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "paid") // hanya pesanan lunas
    .in("status", ["received", "cooking", "served"])
    .select("id, order_number, status")
    .single();

  if (error || !data) {
    return Response.json(
      { error: "Pesanan tidak ditemukan, belum lunas, atau sudah selesai" },
      { status: 404 }
    );
  }

  return Response.json({
    orderId: data.id,
    orderNumber: data.order_number,
    status: data.status,
  });
}
