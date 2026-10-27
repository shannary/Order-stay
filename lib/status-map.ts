/**
 * Pemetaan status pesanan & pembayaran ke Bahasa Indonesia
 * + warna badge yang konsisten lintas layar
 * (pelanggan, POS kasir, KDS dapur).
 */

export type OrderStatusKey = "received" | "cooking" | "served" | "completed";

export const ORDER_STATUS_MAP: Record<
  OrderStatusKey,
  { label: string; badgeClass: string }
> = {
  received: {
    label: "Pesanan Diterima",
    badgeClass: "bg-sky-100 text-sky-800 ring-sky-200", // biru
  },
  cooking: {
    label: "Sedang Dimasak",
    badgeClass: "bg-amber-100 text-amber-800 ring-amber-200", // kuning/amber
  },
  served: {
    label: "Siap Disajikan",
    badgeClass: "bg-violet-100 text-violet-800 ring-violet-200", // ungu
  },
  completed: {
    label: "Selesai",
    badgeClass: "bg-emerald-100 text-emerald-800 ring-emerald-200", // hijau
  },
};

type PaymentStatusKey = "pending" | "paid";

export const PAYMENT_STATUS_MAP: Record<
  PaymentStatusKey,
  { label: string; badgeClass: string }
> = {
  pending: {
    label: "Menunggu Bayar",
    // Kontras tinggi: solid amber vs emerald solid pada 'done'
    badgeClass: "bg-amber-400 text-amber-950 font-semibold ring-2 ring-amber-500",
  },
  paid: {
    label: "Lunas",
    badgeClass: "bg-emerald-600 text-white font-semibold ring-emerald-600",
  },
};

export function orderStatusMeta(status: string) {
  return (
    ORDER_STATUS_MAP[status as OrderStatusKey] ?? {
      label: status,
      badgeClass: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    }
  );
}

export function paymentStatusMeta(status: string) {
  return (
    PAYMENT_STATUS_MAP[status as PaymentStatusKey] ?? {
      label: status,
      badgeClass: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    }
  );
}
