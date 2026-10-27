import type { Metadata } from "next";
import { Suspense } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { CAFE_NAME } from "@/lib/config";
import { OrderStatusClient, type OrderStatusClientProps } from "@/components/order/order-status-client";
import { SplashFallbackInner } from "@/components/catalog/splash-fallback";

export const metadata: Metadata = {
  title: `Status Pesanan · ${CAFE_NAME}`,
};

export default function OrderStatusPage({
  params,
}: PageProps<"/order/[orderId]">) {
  return (
    <Suspense fallback={<SplashFallbackInner />}>
      <OrderStatusContent params={params} />
    </Suspense>
  );
}

async function OrderStatusContent({
  params,
}: {
  params: PageProps<"/order/[orderId]">["params"];
}) {
  const { orderId } = await params;
  const supabase = getSupabaseClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_method, is_approved, total_amount, created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-[#FBFBFA] px-6 text-center">
        <h1 className="text-xl font-bold text-[#18181B]">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="text-sm text-zinc-500">
          Kode pesanan tidak valid atau telah dihapus.
        </p>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, item_name, unit_price, quantity, notes")
    .eq("order_id", orderId)
    .order("id");

  return (
    <OrderStatusClient
      order={{
        id: order.id as string,
        orderNumber: order.order_number as string,
        status: order.status as string,
        paymentStatus: order.payment_status as string,
        paymentMethod: order.payment_method as string,
        isApproved: Boolean(order.is_approved),
        totalAmount: order.total_amount as number,
        createdAt: order.created_at as string,
      }}
      items={(items ?? []) as OrderStatusClientProps["items"]}
    />
  );
}
