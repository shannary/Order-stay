"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Banknote, CheckCheck, Loader2, QrCode, RefreshCw } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { orderStatusMeta, paymentStatusMeta } from "@/lib/status-map";
import { cn } from "@/lib/utils";

type PendingOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  tables: { number: number } | null;
  order_items_count?: number; // dihitung terpisah
};

export function PosClient() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getSupabaseClient>["channel"]
  > | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, payment_method, created_at, tables(number)"
      )
      .eq("payment_status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    setOrders(
      (data ?? []) as unknown as PendingOrder[]
    );
    setLoading(false);
  }, []);

  // 1. Muat daftar pending pertama kali
  useEffect(() => {
    void refetch();
  }, [refetch]);

  // 2. Realtime: INSERT & UPDATE di tabel orders
  useEffect(() => {
    const supabase = getSupabaseClient();

    const channel = supabase
      .channel("pos-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        ({ eventType, new: row }) => {
          void refetch();
          if (eventType === "INSERT" && row) {
            toast.info(
              `Pesanan baru ${(row as Record<string, unknown>).order_number}`
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[POS] realtime aktif");
        }
      });

    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const confirmCash = async (orderId: string, orderNumber: string) => {
    setPaying(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/pay`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal konfirmasi");
      }
      toast.success(`Pembayaran ${orderNumber} diterima`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal konfirmasi");
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-[#FBFBFA] p-4 pb-10 md:p-8">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#18181B]">Kasir · POS</h1>
          <p className="text-xs text-zinc-500">
            Transaksi menunggu pembayaran
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#18181B] ring-1 ring-zinc-200"
        >
          <RefreshCw
            className={cn("size-3.5", loading && "animate-spin")}
            aria-hidden
          />
          Muat ulang
        </button>
      </header>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center gap-2 pt-16 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Memuat…
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          Tidak ada transaksi menunggu.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-[#18181B]">
                    {order.order_number}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Meja {order.tables?.number ?? "?"} ·{" "}
                    {new Date(order.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatRupiah(order.total_amount)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-semibold",
                      orderStatusMeta(order.status).badgeClass
                    )}
                  >
                    {orderStatusMeta(order.status).label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-zinc-200 bg-zinc-50 text-[10px] font-semibold"
                  >
                    {order.payment_method === "cash" ? (
                      <Banknote className="size-3" aria-hidden />
                    ) : (
                      <QrCode className="size-3" aria-hidden />
                    )}
                    {order.payment_method.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {order.payment_method === "cash" && (
                <button
                  type="button"
                  onClick={() => void confirmCash(order.id, order.order_number)}
                  disabled={paying === order.id}
                  className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#4A5D4E] text-sm font-semibold text-[#FBFBFA] transition-colors hover:bg-[#4A5D4E]/90 disabled:opacity-60"
                >
                  {paying === order.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <CheckCheck className="size-4" aria-hidden />
                  )}
                  Konfirmasi Pembayaran Tunai
                </button>
              )}
              {order.payment_method === "qris" && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Menunggu pembayaran QRIS (webhook Midtrans).
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
