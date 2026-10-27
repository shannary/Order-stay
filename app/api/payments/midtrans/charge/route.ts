import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/payments/midtrans/charge  { orderId }
 * Membuat Snap transaction untuk pesanan yang menunggu QRIS.
 * Menyimpan snap_token ke orders.payment_ref ( kontrol state sumber ).
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = (await request.json()) as { orderId?: string };
    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
      return NextResponse.json({ error: "orderId tidak valid" }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (!serverKey || !clientKey) {
      return NextResponse.json(
        { error: "Kunci Midtrans belum dikonfigurasi di .env.local" },
        { status: 501 }
      );
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const apiBase = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const supabase = getSupabaseServerClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, payment_status, payment_method, tables(number)")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    if ((order as any).payment_status !== "pending") {
      return NextResponse.json(
        { error: "Pesanan sudah diproses" },
        { status: 409 }
      );
    }
    if ((order as any).payment_method !== "qris") {
      return NextResponse.json(
        { error: "Pesanan ini bukan metode QRIS" },
        { status: 400 }
      );
    }

    const grossAmount = (order as any).total_amount as number;

    const res = await fetch(apiBase, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${serverKey}:`
        ).toString("base64")}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        customer_details: {
          // identifikasi minimal; identitas tidak wajib di midtrans snap
          first_name: `Meja ${(order as any).tables?.number ?? "-"}`,
        },
        expiry: { duration: 30, unit: "minute" },
      }),
    });

    const data = (await res.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!res.ok || !data.token) {
      console.error("[midtrans charge]", res.status, data);
      return NextResponse.json(
        { error: data.error_messages?.join(", ") ?? "Gagal membuat transaksi QRIS" },
        { status: 502 }
      );
    }

    // Simpan token & url redirect agar tkh bisa melanjutkan pembayaran
    await (supabase as any)
      .from("orders")
      .update({ payment_ref: data.token })
      .eq("id", orderId);

    return NextResponse.json({
      snapToken: data.token,
      clientKey,
      redirectUrl: data.redirect_url ?? null,
      isProduction,
    });
  } catch (err) {
    console.error("[POST /api/payments/midtrans/charge]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
