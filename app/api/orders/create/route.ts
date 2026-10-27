import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

type SubmittedItem = {
  menuItemId: string;
  quantity: number;
  notes?: string | null;
};

type OrderPayload = {
  items: SubmittedItem[];
  paymentMethod: string; // "cash" | "qris"
};

// Batas aman payload (server-side; klaim nilai UI tidak dipercaya)
const MAX_ITEMS_PER_ORDER = 30;
const MAX_QTY_PER_ITEM = 10;

/**
 * POST /api/orders/create
 * Membuat pesanan: insert orders + order_items (harga divalidasi server).
 * - cash  → pending, MENUNGGU approve kasir (tidak masuk KDS dapur)
 * - qris  → pending, setelah ini client memanggil /api/payments/midtrans/charge
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderPayload;

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Keranjang kosong" }, { status: 400 });
    }
    for (const item of body.items) {
      if (
        !item.menuItemId ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QTY_PER_ITEM
      ) {
        return NextResponse.json(
          { error: `Kuantitas per item maksimal ${MAX_QTY_PER_ITEM}` },
          { status: 400 }
        );
      }
      if (typeof item.notes === "string" && item.notes.length > 140) {
        return NextResponse.json(
          { error: "Catatan terlalu panjang" },
          { status: 400 }
        );
      }
    }
    if (body.items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_ITEMS_PER_ORDER} jenis item per pesanan` },
        { status: 400 }
      );
    }

    const paymentMethod = ["cash", "qris"].includes(body.paymentMethod)
      ? body.paymentMethod
      : null;
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Metode pembayaran tidak didukung" },
        { status: 400 }
      );
    }

    const tableId = request.cookies.get("table_id")?.value;
    if (!tableId || !/^[0-9a-f-]{36}$/i.test(tableId)) {
      return NextResponse.json(
        { error: "Sesi meja tidak ditemukan, silakan scan ulang QR" },
        { status: 401 }
      );
    }

    // Rate limit per meja: maks 5 pesanan / 10 menit (pelanggan wajar)
    if (!rateLimit(`order-create:${tableId}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Terlalu banyak pesanan — tunggu beberapa saat atau hubungi barista" },
        { status: 429 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: table, error: tableError } = await supabase
      .from("tables")
      .select("id, number")
      .eq("id", tableId)
      .eq("is_active", true)
      .maybeSingle();

    if (tableError || !table) {
      return NextResponse.json({ error: "Meja tidak valid" }, { status: 400 });
    }

    // Harga diambil ulang dari DB — jangan percaya huja harga dari client
    const menuItemIds = body.items.map((i) => i.menuItemId);
    const { data: menuItems, error: menuError } = await (supabase as any)
      .from("menu_items")
      .select("id, name, price")
      .in("id", menuItemIds)
      .eq("is_available", true);

    if (
      menuError ||
      !menuItems ||
      menuItems.length !== new Set(menuItemIds).size
    ) {
      return NextResponse.json(
        { error: "Beberapa menu tidak tersedia" },
        { status: 400 }
      );
    }

    const menuMap = new Map(
      (menuItems as Array<{ id: string; name: string; price: number }>).map(
        (mi) => [mi.id, mi]
      )
    );
    const totalAmount = body.items.reduce((sum, item) => {
      const mi = menuMap.get(item.menuItemId)!;
      return sum + mi.price * item.quantity;
    }, 0);

    // Kode pesanan unik: ORD-YYYYMMDD-XXXX (retry bila tabrakan 23505)
    const datePart = new Date()
      .toLocaleDateString("en-CA")
      .replaceAll("-", "");

    let orderData: { id: string; order_number: string } | null = null;

    for (let attempt = 0; attempt < 5 && !orderData; attempt++) {
      const candidate = `ORD-${datePart}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const { data, error } = await (supabase as any)
        .from("orders")
        .insert({
          table_id: tableId,
          order_number: candidate,
          status: "received",
          payment_status: "pending",
          payment_method: paymentMethod,
          is_approved: false,
          total_amount: totalAmount,
        })
        .select("id, order_number")
        .single();

      if (data) {
        orderData = data as { id: string; order_number: string };
      } else if (error?.code !== "23505") {
        return NextResponse.json(
          { error: "Gagal menyimpan pesanan" },
          { status: 500 }
        );
      }
    }

    if (!orderData) {
      return NextResponse.json(
        { error: "Gagal membuat kode pesanan" },
        { status: 500 }
      );
    }

    const { error: itemsError } = await (supabase as any)
      .from("order_items")
      .insert(
        body.items.map((item) => {
          const mi = menuMap.get(item.menuItemId)!;
          return {
            order_id: orderData!.id,
            menu_item_id: item.menuItemId,
            item_name: mi.name,
            unit_price: mi.price,
            quantity: item.quantity,
            notes: item.notes?.trim() || null,
          };
        })
      );

    if (itemsError) {
      await (supabase as any).from("orders").delete().eq("id", orderData.id);
      return NextResponse.json(
        { error: "Gagal menyimpan detail pesanan" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        totalAmount,
        next: `/order/${orderData.id}`,
        // QRIS: client lanjut ke /api/payments/midtrans/charge
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/orders/create]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
