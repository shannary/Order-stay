import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/payments/midtrans/charge
 * Membuat transaksi Snap Midtrans (QRIS) untuk pesanan yang sudah dibuat.
 *  - Harga total dibaca dari DB (bukan klien).
 *  - Server key TIDAK pernah keluar dari server.
 * respons: { snapToken, redirectUrl? }
 */
export async function POST(request: NextRequest) {
  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const orderId = body.orderId ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return Response.json({ error: "orderId tidak valid" }, { status: 400 });
  }

  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  if (!serverKey) {
    return Response.json(
      { error: "Pembayaran QRIS belum dikonfigurasi" },
      { status: 503 }
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, total_amount, payment_status, payment_method, tables(number)"
    )
    .eq("id", orderId)
    .maybeSingle();

  const o = order as {
    id: string;
    order_number: string;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    tables: { number: number } | null;
  } | null;

  if (!o || o.payment_method !== "qris") {
    return Response.json(
      { error: "Pesanan tidak memakai QRIS" },
      { status: 400 }
    );
  }
  if (o.payment_status !== "pending") {
    return Response.json(
      { error: "Pesanan sudah diproses" },
      { status: 409 }
    );
  }

  const gross = `${o.total_amount}.00`;
  const apiBase = isProduction
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  try {
    const res = await fetch(apiBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: o.id,
          gross_amount: o.total_amount,
        },
        item_details: [
          {
            id: o.order_number,
            price: o.total_amount,
            quantity: 1,
            name: `Pesan Meja ${o.tables?.number ?? "?"} · ${o.order_number}`,
          },
        ],
        credit_card: { secure: true },
      }),
    });

    const raw = (await res.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!res.ok) {
      const detail =
        raw.error_messages?.[0] ?? `Midtrans error (status ${res.status})`;
      return Response.json({ error: detail }, { status: 502 });
    }

    // Catat referensi pembayaran untuk rekonsiliasi
    await supabase
      .from("orders")
      .update({ payment_ref: raw.token ?? null })
      .eq("id", o.id)
      .eq("payment_status", "pending");

    return Response.json({
      snapToken: raw.token ?? null,
      redirectUrl: raw.redirect_url ?? null,
    });
  } catch {
    return Response.json(
      { error: "Gagal menghubungi Midtrans" },
      { status: 502 }
    );
  }
}
