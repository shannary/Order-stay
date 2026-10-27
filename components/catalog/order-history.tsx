"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Receipt, RefreshCw, ScanQrCode } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { formatRupiah } from "@/lib/format";
import { orderStatusMeta, paymentStatusMeta } from "@/lib/status-map";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SessionOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  created_at: string;
  order_items: Array<{
    item_name: string;
    quantity: number;
    notes: string | null;
  }> | null;
};

/**
 * Riwayat pesanan pada SESI MEJA saat ini.
 * Membaca table_id dari table_session (disimpan oleh table-session.tsx
 * setelah scan QR). Berperilaku mode gelap? tidak — konsisten dengan
 * palet katalog pelanggan.
 */
export function OrderHistory() {
  const [orders, setOrders] = useState<SessionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableId, setTableId] = useState<string | null>(null);

  const refetch = useCallback(async (tid: string) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      // RLS publik read: hanya meja aktif yang terlihat; join ke items
      const { data } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, payment_method, total_amount, created_at, order_items(item_name, quantity, notes)"
        )
        .eq("table_id", tid)
        .order("created_at", { ascending: false })
        .limit(15);
      setOrders((data ?? []) as unknown as SessionOrder[]);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let tid: string | null = null;
    try {
      const raw = localStorage.getItem("table_session");
      tid = raw ? JSON.parse(raw)?.tableId ?? null : null;
    } catch {
      tid = null;
    }
    setTableId(tid);
    if (tid) void refetch(tid);
    else setLoading(false);
  }, [refetch]);

  // Realtime: pembaruan status/pembayaran instan tanpa refresh.
  // Kasir konfirmasi tunai atau dapur mengubah status → event UPDATE
  // tesebar karena filter table_id milik meja ini.
  useEffect(() => {
    if (!tableId) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`table-orders-${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${tableId}`,
        },
        ({ eventType, new: row }) => {
          void refetch(tableId);
          if (eventType === "UPDATE" && row) {
            const updated = row as Record<string, unknown>;
            if (updated.payment_status === "paid") {
              toast.success(
                `Pembayaran ${(updated.order_number as string) ?? ""} diterima — pesanan menuju dapur`
              );
            }
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tableId, refetch]);

  if (!tableId) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <ScanQrCode className="size-8 text-zinc-300" aria-hidden />
        <p className="text-sm text-zinc-500">
          Scan QR meja untuk melihat riwayat pesanan.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
        <span className="size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-[#4A5D4E]" />
        Memuat riwayat…
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
        Belum ada pesanan pada sesi meja ini.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {orders.length} pesanan pada meja ini
        </p>
        <button
          type="button"
          onClick={() => void refetch(tableId)}
          className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#18181B] ring-1 ring-zinc-200"
        >
          <RefreshCw className="size-3" aria-hidden />
          Muat ulang
        </button>
      </div>
      {orders.map((order) => {
        const statusMeta = orderStatusMeta(order.status);
        const payMeta = paymentStatusMeta(order.payment_status);
        return (
          <article
            key={order.id}
            className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-[#18181B]">
                  {order.order_number}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(order.created_at).toLocaleString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-semibold", statusMeta.badgeClass)}
                >
                  <Receipt className="size-3" aria-hidden />
                  {statusMeta.label}
                </Badge>
                <Badge className={cn("text-[10px]", payMeta.badgeClass)}>
                  {payMeta.label}
                </Badge>
              </div>
            </div>

            {/* Instruksi menonjol untuk pembayaran tunai yang belum valid */}
            {order.payment_status === "pending" &&
              order.payment_method === "cash" && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-400/90 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-950 shadow-sm">
                  <ScanQrCode className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    Silakan tunjukkan kode pesanan{" "}
                    <span className="font-mono underline">
                      #{order.order_number}
                    </span>{" "}
                    ke Kasir untuk memvalidasi pembayaran.
                  </span>
                </div>
              )}

            <ul className="mt-2 space-y-1 border-t border-zinc-100 pt-2">
              {(order.order_items ?? []).map((item, index) => (
                <li key={index} className="flex justify-between gap-2 text-xs">
                  <span className="text-[#18181B]">
                    {item.quantity}× {item.item_name}
                  </span>
                  <span className="text-zinc-400">{item.notes}</span>
                </li>
              ))}
            </ul>

            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
              <span className="text-xs text-zinc-500">Total</span>
              <span className="text-sm font-bold text-[#18181B]">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
