import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type WebhookBody = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string;
};

/**
 * POST /api/payments/midtrans/webhook
 * Notifikasi Midtrans. Validasi anti-tamper:
 *   signature_key = sha512(order_id + status_code + gross_amount + SERVER_KEY)
 * signature_key tidak cocok → 403 tanpa merubah status.
 * settlement / capture(clear) → paid + is_approved (trigger SQL ikut menyetel).
 */
export async function POST(request: NextRequest) {
  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const {
    order_id: orderId,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
  } = body;

  if (!orderId || !signatureKey || !statusCode || !grossAmount) {
    return Response.json({ error: "Payload tidak lengkap" }, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return Response.json({ error: "Server key belum disetel" }, { status: 503 });

  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
  if (expected !== signatureKey) {
    // Bukan dari Midtrans → tolak TANPA membocorkan status order
    return Response.json({ error: "signature tidak valid" }, { status: 403 });
  }

  const settle =
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept");
  if (!settle) {
    // pending/expire/failure → biarkan status pending (atau expire/kadaluarsa)
    return Response.json({ ok: true, acted: false });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      is_approved: true,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .eq("payment_method", "qris")
    .select("id")
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "Gagal memperbarui status" },
      { status: 500 }
    );
  }
  if (!data) {
    // Idempotent — sudah paid sebelumnya / order berbeda → tetap 200 agar
    // Midtrans tidak me-retry terus.
    return Response.json({ ok: true, acted: false });
  }

  return Response.json({ ok: true, acted: true });
}
