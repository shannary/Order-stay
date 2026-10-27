"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Flame,
  Loader2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { orderStatusMeta } from "@/lib/status-map";
import { cn } from "@/lib/utils";

type KdsItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
};

type KitchenOrder = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  tables: { number: number } | null;
  order_items: KdsItem[] | null;
};

export function KdsClient() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState<string | null>(null);
  const orderRef = useRef<ReturnType<ReturnType<typeof getSupabaseClient>["channel"]> | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    // KDS HANYA menampilkan pesanan yang sudah LUNAS (payment_status='paid')
    // dan belum completed — pesanan tunai baru masuk setelah kasir konfirmasi,
    // sementara pesanan QRIS masuk otomatis lewat webhook Midtrans.
    const { data } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, total_amount, created_at, tables(number), order_items(item_name, quantity, unit_price, notes)"
      )
      .eq("payment_status", "paid")
      .in("status", ["received", "cooking", "served"])
      .order("created_at", { ascending: true })
      .limit(50);

    setOrders((data ?? []) as unknown as KitchenOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  // Realtime: update instan tanpa refresh
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("kds-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          void refetch();
        }
      )
      .subscribe();
    orderRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const complete = async (orderId: string, orderNumber: string) => {
    setFinishing(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menandai selesai");
      toast.success(`${orderNumber} selesai`);
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menandai selesai");
    } finally {
      setFinishing(null);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-6xl bg-[#FBFBFA] p-4 pb-10 md:p-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-[#18181B]">
            <Flame className="size-5 text-[#4A5D4E]" aria-hidden />
            KDS · Dapur
          </h1>
          <p className="text-xs text-zinc-500">
            Hanya pesanan lunas yang tampil di sini
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
          Memuat antrean…
        </div>
      ) : orders.length === 0 ? (
        <p className="rounded-2xl bg-white p-10 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          Antrean dapur kosong.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
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
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-[10px] font-semibold",
                    orderStatusMeta(order.status).badgeClass
                  )}
                >
                  <Clock className="size-3" aria-hidden />
                  {orderStatusMeta(order.status).label}
                </Badge>
              </div>

              <ul className="mt-3 grow space-y-1.5 border-t border-zinc-100 pt-3">
                {(order.order_items ?? []).map((item, index) => (
                  <li key={index} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[#18181B]">
                        {item.quantity}× {item.item_name}
                      </span>
                      {item.notes && (
                        <p className="text-xs text-amber-700 italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatRupiah(item.unit_price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => void complete(order.id, order.order_number)}
                disabled={finishing === order.id}
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-[#4A5D4E] text-sm font-semibold text-[#FBFBFA] transition-colors hover:bg-[#4A5D4E]/90 disabled:opacity-60"
              >
                {finishing === order.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden />
                )}
                Tandai Selesai
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
