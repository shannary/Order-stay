"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Info,
  Flame,
  Utensils,
  PartyPopper,
  ArrowLeft,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { ORDER_STATUS_MAP, paymentStatusMeta } from "@/lib/status-map";
import { cn } from "@/lib/utils";

export type OrderStatusClientProps = {
  order: {
    id: string;
    orderNumber: string;
    status: string; // received | cooking | served | completed
    paymentStatus: string; // pending | paid
    paymentMethod: string; // cash | qris | ...
    isApproved: boolean;
    totalAmount: number;
    createdAt: string;
  };
  items: Array<{
    id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    notes: string | null;
  }>;
};

const STEPS = [
  { id: "received", Icon: Clock },
  { id: "cooking", Icon: Flame },
  { id: "served", Icon: Utensils },
  { id: "completed", Icon: PartyPopper },
];

export function OrderStatusClient({ order, items }: OrderStatusClientProps) {
  const [live, setLive] = useState(order);

  // Realtime: pembaruan status/pembayaran dipush dari server
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const row = payload.new as Partial<typeof order>;
          setLive((prev) => ({ ...prev, ...row }));
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [order.id]);

  const currentStep = Math.max(
    0,
    STEPS.findIndex((s) => s.id === live.status)
  );
  const waitingApproval = !live.isApproved;
  const canCancel =
    live.paymentStatus === "pending" && live.status === "received";
  const router = useRouter();

  const cancelOrder = async () => {
    if (!confirm("Batalkan pesanan ini?")) return;
    try {
      const res = await fetch(`/api/orders/${live.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membatalkan");
      toast.info("Pesanan dibatalkan");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan");
    }
  };

  return (
    <div className="min-h-dvh bg-[#FBFBFA] pb-10">
      <main className="mx-auto max-w-md space-y-4 p-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:text-[#18181B]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali
        </button>

        {/* Kode pesanan utama */}
        <Card className="rounded-2xl border-zinc-200 bg-white shadow-none">
          <CardContent className="p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Kode Pesanan
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[#4A5D4E]">
              {order.orderNumber}
            </p>
            {order.paymentMethod === "cash" && (
              <div className="mt-4 rounded-xl bg-[#4A5D4E]/10 p-3 text-xs leading-relaxed text-[#18181B]">
                <span className="font-bold">Cara bayar:</span> tunjukkan kode{" "}
                <span className="font-mono font-bold">
                  {order.orderNumber}
                </span>{" "}
                kepada kasir dan bayar{" "}
                <span className="font-bold">
                  {formatRupiah(order.totalAmount)}
                </span>{" "}
                secara tunai. Kasir akan mengonfirmasi pembayaran.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Belum approve → belum masuk dapur */}
        {waitingApproval ? (
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Menunggu konfirmasi{" "}
              {order.paymentMethod === "cash" ? "kasir" : "pembayaran"}. Pesanan
              akan diteruskan ke dapur setelah{" "}
              {order.paymentMethod === "cash"
                ? "pembayaran diapprove."
                : "pembayaran terverifikasi."}
            </span>
          </div>
        ) : (
          <Card className="rounded-2xl border-zinc-200 bg-white shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <div className="flex w-full items-center">
                      <span
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          index === 0 && "invisible",
                          index <= currentStep && index > 0
                            ? "bg-[#4A5D4E]"
                            : "bg-zinc-200"
                        )}
                      />
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full",
                          index < currentStep
                            ? "bg-[#4A5D4E] text-[#FBFBFA]"
                            : index === currentStep
                              ? "bg-[#4A5D4E] text-[#FBFBFA]"
                              : "bg-zinc-100 text-zinc-400"
                        )}
                      >
                        {index < currentStep ? (
                          <Check className="size-4" aria-hidden />
                        ) : (
                          <step.Icon className="size-4" aria-hidden />
                        )}
                      </span>
                      <span
                        className={cn(
                          "h-1 flex-1 rounded-full",
                          index === STEPS.length - 1 && "invisible",
                          index < currentStep ? "bg-[#4A5D4E]" : "bg-zinc-200"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        index <= currentStep ? "text-[#18181B]" : "text-zinc-400"
                      )}
                    >
                      {ORDER_STATUS_MAP[step.id as keyof typeof ORDER_STATUS_MAP].label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ringkasan */}
        <Card className="rounded-2xl border-zinc-200 bg-white shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between font-bold">
              <span className="text-sm text-[#18181B]">Ringkasan</span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  paymentStatusMeta(live.paymentStatus).badgeClass
                )}
              >
                {paymentStatusMeta(live.paymentStatus).label}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#18181B]">
                      {item.quantity}× {item.item_name}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-zinc-500 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-medium">
                    {formatRupiah(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="text-base font-bold text-[#18181B]">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Batalkan pesanan — hanya sebelum dibayar & belum diapprove dapur */}
        {canCancel && (
          <button
            type="button"
            onClick={() => void cancelOrder()}
            className="h-11 w-full rounded-full border border-red-200 bg-red-50 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            Batalkan Pesanan (Tidak Jadi)
          </button>
        )}
      </main>
    </div>
  );
}
