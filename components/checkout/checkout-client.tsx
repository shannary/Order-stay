"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, Loader2, QrCode, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import type { CartItem } from "@/components/catalog/customization-sheet";
import { BackButton } from "@/components/catalog/back-button";
import { cn } from "@/lib/utils";

const CART_KEY = "orders_cart_v1";

// Tip minimal untuk Snap Midtrans
function waitForSnap(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).snap) return resolve();
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Snap Midtrans"));
    document.body.appendChild(script);
  });
}

export type PaymentResult = {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  next: string;
};

export function CheckoutClient() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [method, setMethod] = useState<"cash" | "qris">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [loadingCart, setLoadingCart] = useState(true);

  useEffect(() => {
    try {
      setCart(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"));
    } catch {
      setCart([]);
    }
    const session = localStorage.getItem("table_session");
    if (session) {
      try {
        setTableNumber(JSON.parse(session).tableNumber ?? "");
      } catch {
        // ignore
      }
    }
    setLoadingCart(false);
  }, []);

  // Sync balik: perubahan keranjang di checkout tetap tersimpan
  useEffect(() => {
    if (loadingCart) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, loadingCart]);

  const total = cart.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity,
    0
  );

  const submit = async () => {
    setSubmitting(true);
    try {
      // 1. Buat pesanan
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: method,
          items: cart.map((i) => ({
            menuItemId: i.menuItem.id,
            quantity: i.quantity,
            notes: i.notes || null,
          })),
        }),
      });
      const data = (await res.json()) as PaymentResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Gagal mengirim pesanan");
      }

      // 2. Cash → layar tiket tunai
      if (method === "cash") {
        localStorage.removeItem(CART_KEY);
        toast.success(`Pesanan ${data.orderNumber} dikirim!`);
        window.location.href = data.next;
        return;
      }

      // 3. QRIS → minta snap token lalu buka popup Midtrans Snap
      const chargeRes = await fetch("/api/payments/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const charge = (await chargeRes.json()) as {
        snapToken?: string;
        redirectUrl?: string | null;
        error?: string;
      };
      if (!chargeRes.ok || !charge.snapToken) {
        throw new Error(
          charge.error ?? "Gagal membuat pembayaran QRIS — coba metode tunai"
        );
      }

      if (charge.redirectUrl) {
        window.location.href = charge.redirectUrl;
        return;
      }

      await waitForSnap();
      (
        window as any
      ).snap.pay(charge.snapToken, {
        onSuccess: () => {
          localStorage.removeItem(CART_KEY);
          window.location.href = data.next;
        },
        onPending: () => {
          localStorage.removeItem(CART_KEY);
          window.location.href = data.next;
        },
        onError: () => {
          toast.error("Pembayaran gagal — silakan coba lagi di kasir");
          window.location.href = data.next;
        },
        onClose: () => {
          toast.info("Kamu bisa lanjut membayar via link QRIS nanti");
          window.location.href = data.next;
        },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengirim pesanan"
      );
      setSubmitting(false);
    }
  };

  if (loadingCart) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#FBFBFA] text-sm text-zinc-500">
        Memuat keranjang…
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FBFBFA] text-center">
        <p className="text-lg font-bold text-[#18181B]">Keranjang kosong</p>
        <p className="text-sm text-zinc-500">Silakan pilih menu terlebih dahulu.</p>
        <BackButton fallbackHref="/" className="rounded-full bg-white px-4 py-2 ring-1 ring-zinc-200" />
      </div>
    );
  }

  const emptyCart = () => {
    localStorage.removeItem(CART_KEY);
    setCart([]);
    toast.info("Keranjang dikosongkan — tidak jadi pesan");
  };

  return (
    <div className="min-h-dvh bg-[#FBFBFA] pb-28">
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="flex items-center justify-between">
          <BackButton fallbackHref="/" label="Menu" />
          <button
            type="button"
            onClick={emptyCart}
            className="text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Tidak Jadi · Kosongkan
          </button>
        </div>
        <h1 className="text-xl font-bold text-[#18181B]">Checkout</h1>
        {tableNumber && (
          <p className="flex items-center gap-1.5 text-sm text-zinc-500">
            <Table2 className="size-4" aria-hidden /> Meja {tableNumber}
          </p>
        )}

        <Card className="rounded-2xl border-zinc-200 bg-white shadow-none">
          <CardContent className="divide-y divide-zinc-100 p-4">
            {cart.map((item) => (
              <div
                key={item.uniqueId}
                className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#18181B]">
                    {item.quantity}× {item.menuItem.name}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-zinc-500 italic">
                      Note: {item.notes}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCart((prev) =>
                        prev.filter((i) => i.uniqueId !== item.uniqueId)
                      );
                    }}
                    className="mt-0.5 text-[11px] font-semibold text-red-600 underline-offset-2 hover:underline"
                  >
                    Tidak jadi item ini
                  </button>
                </div>
                <span className="shrink-0 text-sm font-medium text-[#18181B]">
                  {formatRupiah(item.menuItem.price * item.quantity)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-[#18181B]">
            Metode Pembayaran
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  id: "cash",
                  label: "Tunai",
                  desc: "Bayar ke kasir nanti",
                  Icon: Banknote,
                },
                {
                  id: "qris",
                  label: "QRIS",
                  desc: "Scan & bayar sekarang",
                  Icon: QrCode,
                },
              ] as const
            ).map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border-2 bg-white p-4 text-left transition-colors",
                  method === id
                    ? "border-[#4A5D4E]"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <Icon
                  className={cn(
                    "size-5",
                    method === id ? "text-[#4A5D4E]" : "text-zinc-400"
                  )}
                  aria-hidden
                />
                <span className="text-sm font-bold text-[#18181B]">
                  {label}
                </span>
                <span className="text-xs text-zinc-500">{desc}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-zinc-500">Total</span>
          <span className="text-lg font-bold text-[#18181B]">
            {formatRupiah(total)}
          </span>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
        <div className="mx-auto max-w-md">
          <Button
            onClick={submit}
            disabled={submitting}
            className="h-12 w-full rounded-full bg-[#4A5D4E] text-sm font-semibold text-[#FBFBFA] hover:bg-[#4A5D4E]/90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {submitting
              ? "Mengirim pesanan…"
              : `Kirim Pesanan · ${formatRupiah(total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
