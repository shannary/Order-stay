import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

type IncomingItem = {
  menuItemId: string;
  quantity: number;
  notes?: string | null;
};

/**
 * POST /api/orders/create
 * Membuat pesanan bagi pelanggan yang memindai QR meja:
 *  1. Validasi cookie table_id (dari hasil scan QR) — keaslian sesi
 *     tidak bisa dimanipulasi hanya dengan tahu nomor meja.
 *  2. Validasi meja masih aktif di database (service role).
 *  3. Harga & total dihitung server-side dari menu_items (snapshot)
 *     — total_amount dari klien TIDAK dipercaya sama sekali.
 *  4. Rate-limit: 5 order / 10 menit per meja (anti-spam).
 */
export async function POST(request: NextRequest) {
  let body: { paymentMethod?: string; items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const paymentMethod =
    body.paymentMethod === "qris" || body.paymentMethod === "cash"
      ? body.paymentMethod
      : null;
  const items = body.items ?? [];

  if (!paymentMethod) {
    return Response.json(
      { error: "Metode pembayaran tidak dikenal" },
      { status: 400 }
    );
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Keranjang kosong" }, { status: 400 });
  }

  // ---- Validasi sesi meja (cookie dari scan QR) ----
  const tableIdCookie = request.cookies.get("table_id")?.value;
  if (!tableIdCookie || !/^[0-9a-f-]{36}$/i.test(tableIdCookie)) {
    return Response.json(
      { error: "Sesi meja tidak ditemukan — silakan scan QR meja" },
      { status: 401 }
    );
  }

  if (!rateLimit(`order:${tableIdCookie}`, 5, 10 * 60 * 1000)) {
    return Response.json(
      { error: "Terlalu banyak pesanan — tunggu sebentar" },
      { status: 429 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Meja harus aktif
  const { data: table } = await supabase
    .from("tables")
    .select("id, number, is_active")
    .eq("id", tableIdCookie)
    .maybeSingle();

  const t = table as { id: string; number: number; is_active: boolean } | null;
  if (!t || !t.is_active) {
    return Response.json(
      { error: "Meja tidak aktif — silakan scan QR meja yang valid" },
      { status: 403 }
    );
  }

  // ---- Validasi item: ambil harga & nama dari DB (bukan dari klien) ----
  const ids = items
    .map((i) => i.menuItemId)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (ids.length === 0) {
    return Response.json({ error: "Item pesanan tidak valid" }, { status: 400 });
  }

  const { data: menuRows } = await supabase
    .from("menu_items")
    .select("id, name, price, is_available")
    .in("id", ids);

  const menuById = new Map(
    ((menuRows ?? []) as Array<{
      id: string;
      name: string;
      price: number;
      is_available: boolean;
    }>).map((m) => [m.id, m])
  );

  type PreparedItem = {
    menu_item_id: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    notes: string | null;
  };

  const prepared: PreparedItem[] = [];
  let totalAmount = 0;

  for (const item of items) {
    const menu = menuById.get(item.menuItemId);
    if (!menu || !menu.is_available) {
      return Response.json(
        { error: "Ada menu yang tidak tersedia — muat ulang katalog" },
        { status: 400 }
      );
    }
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return Response.json(
        { error: "Jumlah item tidak valid" },
        { status: 400 }
      );
    }
    prepared.push({
      menu_item_id: menu.id,
      item_name: menu.name, // snapshot nama
      unit_price: menu.price, // snapshot harga
      quantity,
      notes: (item.notes ?? "").toString().slice(0, 200) || null,
    });
    totalAmount += menu.price * quantity;
  }

  // ---- Buat order_number unik: OS-YYMMDD-XXXX ----
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(2)}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const makeNumber = () =>
    `OS-${datePart}-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 4)
      .toUpperCase()}`;

  // Insert order + items relay dengan coba nomor lagi bila bentrok unik
  for (let attempt = 0; attempt < 5; attempt++) {
    const orderNumber = makeNumber();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: t.id,
        order_number: orderNumber,
        payment_method: paymentMethod,
        total_amount: totalAmount,
        status: "received",
        payment_status: "pending",
      })
      .select("id, order_number")
      .single();

    if (order && !orderError) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          prepared.map((p) => ({ ...p, order_id: (order as { id: string }).id }))
        );

      if (itemsError) {
        // Rollback order agar tidak yatim
        await supabase.from("orders").delete().eq("id", (order as { id: string }).id);
        return Response.json(
          { error: "Gagal mencatat item pesanan" },
          { status: 500 }
        );
      }

      return Response.json(
        {
          orderId: (order as { id: string }).id,
          orderNumber: (order as { order_number: string }).order_number,
          totalAmount,
          next: `/order/${(order as { id: string }).id}`,
        },
        { status: 201 }
      );
    }

    const message = orderError ? String(orderError) : "";
    if (!message.includes("unique") && !message.includes("duplicate")) {
      return Response.json(
        { error: "Gagal membuat pesanan" },
        { status: 500 }
      );
    }
    // bentrok order_number → coba nomor lain
  }

  return Response.json(
    { error: "Gagal membuat pesanan — coba lagi" },
    { status: 500 }
  );
}
