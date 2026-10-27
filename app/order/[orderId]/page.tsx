import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import {
  OrderStatusClient,
} from "@/components/order/order-status-client";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Layar status realtime pesanan pelanggan: /order/{orderId}
 * Menampilkan kode pesanan + progres received→cooking→served→completed,
 * teks instruksi pembayaran tunai, dan tombol batalkan bila masih pending.
 */
export default function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center gap-2 bg-[#FBFBFA] text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Memuat status pesanan…
        </div>
      }
    >
      <OrderContent paramsPromise={params} />
    </Suspense>
  );
}

async function OrderContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ orderId: string }>;
}) {
  const { orderId } = await paramsPromise;

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return <OrderNotFound />;
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: orderRow } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, payment_method, is_approved, total_amount, created_at"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (!orderRow) return <OrderNotFound />;

    const { data: items } = await supabase
      .from("order_items")
      .select("id, item_name, unit_price, quantity, notes")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    const o = orderRow as {
      id: string;
      order_number: string;
      status: string;
      payment_status: string;
      payment_method: string;
      is_approved: boolean;
      total_amount: number;
      created_at: string;
    };

    return (
      <OrderStatusClient
        order={{
          id: o.id,
          orderNumber: o.order_number,
          status: o.status,
          paymentStatus: o.payment_status,
          paymentMethod: o.payment_method,
          isApproved: o.is_approved,
          totalAmount: o.total_amount,
          createdAt: o.created_at,
        }}
        items={(items ?? []) as never}
      />
    );
  } catch {
    return <OrderNotFound />;
  }
}

function OrderNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#FBFBFA] px-6 text-center">
      <p className="text-lg font-bold text-[#18181B]">
        Pesanan tidak ditemukan
      </p>
      <p className="max-w-xs text-sm text-zinc-500">
        Pesanan mungkin sudah dibatalkan atau tidak pernah ada. Silakan scan QR
        meja untuk memesan kembali.
      </p>
      <a
        href="/"
        className="rounded-full bg-[#4A5D4E] px-5 py-2.5 text-sm font-semibold text-[#FBFBFA]"
      >
        Kembali ke Beranda
      </a>
    </div>
  );
}
