"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatRupiah } from "@/lib/format";
import type { MenuItem } from "@/lib/mock-menu";

export type CartItem = {
  uniqueId: string;
  menuItem: MenuItem;
  quantity: number;
  options: Record<string, string>;
  notes: string;
};

type CustomizationSheetProps = {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (cartItem: CartItem) => void;
};

export function CustomizationSheet({
  item,
  open,
  onOpenChange,
  onAdd,
}: CustomizationSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  // Reset state setiap kali item baru dibuka
  useEffect(() => {
    if (open && item) {
      setQuantity(1);
      setNotes("");
      const defaults: Record<string, string> = {};
      for (const group of item.optionGroups ?? []) {
        // Default: salah satu opsi pertama (mis. "100%" / "Normal")
        defaults[group.id] = group.options[0];
      }
      setSelected(defaults);
    }
  }, [open, item]);

  if (!item) return null;

  const handleOption = (groupId: string, option: string) => {
    setSelected((prev) => ({ ...prev, [groupId]: option }));
  };

  const handleAdd = () => {
    const optionsSignature = item.optionGroups
      ?.map((g) => `${g.id}=${selected[g.id] ?? ""}`)
      .join("|");
    onAdd({
      uniqueId: `${item.id}#${optionsSignature ?? ""}#${notes.trim()}`,
      menuItem: item,
      quantity,
      options: { ...selected },
      notes: notes.trim(),
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#FBFBFA]">
        <div className="mx-auto max-w-md">
          <DrawerHeader className="flex-row items-center gap-3 pt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.name}
              className="size-14 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <DrawerTitle className="text-base font-bold text-[#18181B]">
                {item.name}
              </DrawerTitle>
              <p className="text-sm font-semibold text-[#4A5D4E]">
                {formatRupiah(item.price)}
              </p>
            </div>
          </DrawerHeader>

          <div className="max-h-[45vh] overflow-y-auto px-4 pb-2">
            {(item.optionGroups ?? []).map((group) => (
              <section key={group.id} className="mb-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {group.label}
                  {group.required && (
                    <span className="ml-1 text-[#4A5D4E]">*</span>
                  )}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleOption(group.id, option)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150",
                        selected[group.id] === option
                          ? "border-[#4A5D4E] bg-[#4A5D4E] text-[#FBFBFA]"
                          : "border-zinc-300 bg-white text-[#18181B]/70 hover:border-[#4A5D4E]/50"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </section>
            ))}

            <section className="mb-2">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Notes
              </h4>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: less sugar, tanpa es, pedas"
                maxLength={140}
              />
            </section>
          </div>

          <DrawerFooter className="flex-row items-center gap-3 pb-6">
            <div className="flex items-center gap-3 rounded-full bg-zinc-200/60 px-2 py-1">
              <button
                type="button"
                aria-label="Kurangi"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex size-7 items-center justify-center rounded-full bg-white text-[#18181B] disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="min-w-4 text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Tambah"
                onClick={() => setQuantity((q) => Math.min(30, q + 1))}
                className="flex size-7 items-center justify-center rounded-full bg-white text-[#18181B]"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            <DrawerClose
              onClick={handleAdd}
              className="ml-auto flex-1 rounded-full bg-[#4A5D4E] py-2 text-sm font-semibold text-[#FBFBFA] hover:bg-[#4A5D4E]/90"
            >
              Add to Cart · {formatRupiah(item.price * quantity)}
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
