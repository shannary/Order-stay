"use client";
import { CAFE_NAME } from "@/lib/config";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { TableHeader } from "@/components/catalog/table-header";
import { CategoryTabs } from "@/components/catalog/category-tabs";
import { MenuCard } from "@/components/catalog/menu-card";
import {
  CustomizationSheet,
  type CartItem,
} from "@/components/catalog/customization-sheet";
import { CartBar } from "@/components/catalog/cart-bar";
import { OrderHistory } from "@/components/catalog/order-history";
import { UtensilsCrossed, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_MENU, type MenuItem } from "@/lib/mock-menu";
import { getSupabaseClient } from "@/lib/supabase";

type MenuCatalogProps = {
  tableNumber: string;
};

export function MenuCatalog({ tableNumber }: MenuCatalogProps) {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>(MOCK_MENU);
  const [view, setView] = useState<"menu" | "history">("menu");

  // ambil menu Supabase; fallback ke mock kalau database kosong/gagal
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await getSupabaseClient()
        .from("menu_items")
        .select("id, name, description, price, category, image_url")
        .eq("is_available", true)
        .order("sort_order", { ascending: true });
      if (!cancelled) {
        if (!error && data && data.length > 0) {
          setMenu(
            data.map(
              (
                item: {
                  id: string;
                  name: string;
                  description: string | null;
                  price: number;
                  category: string;
                  image_url: string | null;
                }
              ) => ({
                id: item.id,
                name: item.name,
                description: item.description ?? "",
                price: item.price,
                category: item.category,
                imageUrl:
                  item.image_url ??
                  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop",
              })
            )
          );
        } else if (error) {
          toast.error("Menu gagal dimuat — menikmati contoh menu");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist keranjang — dibaca kembali oleh halaman checkout
  useEffect(() => {
    try {
      localStorage.setItem("orders_cart_v1", JSON.stringify(cart));
    } catch {
      // ignore: storage penuh / mode privat
    }
    window.dispatchEvent(new Event("cart-updated"));
  }, [cart]);

  const filteredItems = useMemo(
    () =>
      category === "all"
        ? menu
        : menu.filter((item) => item.category === category),
    [category, menu]
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  const addToCart = (cartItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.uniqueId === cartItem.uniqueId);
      if (existing) {
        return prev.map((i) =>
          i.uniqueId === cartItem.uniqueId
            ? { ...i, quantity: i.quantity + cartItem.quantity }
            : i
        );
      }
      return [...prev, cartItem];
    });
    toast.success(`${cartItem.menuItem.name} ditambahkan ke keranjang`);
  };

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  return (
    <div className="min-h-dvh bg-[#FBFBFA] pb-24">
      <TableHeader cafeName={CAFE_NAME} tableNumber={tableNumber} />
      <CategoryTabs active={category} onChange={setCategory} />

      {/* Toggle: Menu / Riwayat pesanan sesi meja */}
      <div className="mx-auto mt-3 max-w-md px-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-zinc-200/60 p-1">
          {(
            [
              { id: "menu", label: "Menu", Icon: UtensilsCrossed },
              { id: "history", label: "Riwayat", Icon: History },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors",
                view === id
                  ? "bg-white text-[#18181B] shadow-sm"
                  : "text-zinc-500"
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-md px-4 pt-3">
        {view === "history" ? (
          <OrderHistory />
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              <div key={category} className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onSelect={(i) => {
                      setSelected(i);
                      setSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            </AnimatePresence>
            {filteredItems.length === 0 && (
              <p className="pt-10 text-center text-sm text-zinc-500">
                Belum ada menu di kategori ini.
              </p>
            )}
          </>
        )}
      </main>

      <CustomizationSheet
        item={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAdd={addToCart}
      />
      {view === "menu" && (
        <CartBar
          totalItems={totalItems}
          totalPrice={totalPrice}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}
