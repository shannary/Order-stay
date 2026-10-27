import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type MidtransWebhook = {
  order_id: string;           // = orders.id yang kita kirim saat charge
  status_code: string;        // cth "200"
  gross_amount: string;       // cth "24000.00"
  signature_key: string;
  transaction_status: string; // capture | settlement | pending | deny | expire | cancel | failure
  transaction_time?: string;
};

/** SHA512(order_id + status_code + gross_amount + server_key) */
function verifySignature(payload: MidtransWebhook, serverKey: string): boolean {
  const expected = createHmac("sha512", serverKey)
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}`
    )
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(payload.signature_key ?? "", "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/payments/midtrans/webhook
 * Endpoint notifikasi Midtrans (tanpa auth, dilindungi signature_key).
 * settlement/capture → payment_status='paid' (+ paid_at) —
 * trigger orders_auto_approve akan set is_approved=true sehingga
 * pesanan otomatis masuk KDS dapur, dpn realtime ke seluruh pelanggan.
 */
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as MidtransWebhook;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      return NextResponse.json(
        { error: "Kunci Midtrans belum dikonfigurasi" },
        { status: 501 }
      );
    }

    // 1. Verifikasi signature — tolak sejak awal bila tidak valid
    if (!verifySignature(payload, serverKey)) {
      return NextResponse.json(
        { error: "Signature tidak valid" },
        { status: 401 }
      );
    }

    if (!/^[0-9a-f-]{36}$/i.test(payload.order_id)) {
      return NextResponse.json(
        { error: "order_id tidak valid" },
        { status: 400 }
      );
    }

    const paid =
      payload.transaction_status === "settlement" ||
      payload.transaction_status === "capture";

    // 2. Update hanya pesanan yang masih pending (idempotent)
    if (paid) {
      const supabase = getSupabaseServerClient();
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          paid_at: payload.transaction_time
            ? new Date(payload.transaction_time).toISOString()
            : new Date().toISOString(),
        })
        .eq("id", payload.order_id)
        .eq("payment_status", "pending");

      if (updateError) {
        console.error("[midtrans webhook] update gagal", updateError);
        // 500 supaya Midtrans memasukkan ke antrean retry
        return NextResponse.json(
          { error: "Gagal memperbarui pesanan" },
          { status: 500 }
        );
      }
    }

    // 3. Midtrans wajib menerima HTTP 2xx back
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[POST /api/payments/midtrans/webhook]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
