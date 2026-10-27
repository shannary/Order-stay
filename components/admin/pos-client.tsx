"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Banknote, CheckCheck, Loader2, QrCode, RefreshCw } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { orderStatusMeta } from "@/lib/status-map";
import { BackButton } from "@/components/catalog/back-button";
import { cn } from "@/lib/utils";

type PendingOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  tables: { number: number } | null;
};

export function PosClient() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders?queue=pending");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat");
      const list = (data.orders ?? []) as PendingOrder[];

      // Deteksi pesanan baru untuk toast realtime (payload anon bisa
      // ter-filter RLS, jadi identifikasi dari hasil refetch server).
      const fresh = list.filter((o) => !knownIdsRef.current.has(o.id));
      for (const o of fresh) {
        if (knownIdsRef.current.size > 0) {
          toast.info(`Pesanan baru ${o.order_number}`);
        }
      }
      knownIdsRef.current = new Set(list.map((o) => o.id));
      setOrders(list);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Muat daftar pending pertama kali
  useEffect(() => {
    void refetch();
  }, [refetch]);

  // 2. Realtime: pemicu refetch — data baca tetap lewat API server
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("pos-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refetch();
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          console.log("[POS] realtime aktif");
        }
      });

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

  const cancelPending = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Batalkan pesanan ${orderNumber}?`)) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membatalkan");
      toast.info(`${orderNumber} dibatalkan`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan");
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-[#FBFBFA] p-4 pb-10 md:p-8">
      <div className="mb-2">
        <BackButton fallbackHref="/" label="Beranda" />
      </div>
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
              <button
                type="button"
                onClick={() =>
                  void cancelPending(order.id, order.order_number)
                }
                className="mt-2 h-9 w-full rounded-full border border-red-200 bg-red-50 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                Batalkan Pesanan
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
