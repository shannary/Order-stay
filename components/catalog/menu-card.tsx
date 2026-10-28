"use client";

import { motion } from "framer-motion";
import { Plus, Star } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { MenuItem } from "@/lib/mock-menu";
import { cn } from "@/lib/utils";

type MenuCardProps = {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  /** 0 grid-ke-N — dipakai untuk variasi tinggi gambar + label Pilihan */
  index?: number;
};

export function MenuCard({ item, onSelect, index = 0 }: MenuCardProps) {
  const featured = index < 2; // 2 menu ter atas diberi label Pilihan
  const tall = index % 4 === 0; // variasi ritme visual (jenjang jejarion)

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => onSelect(item)}
      className={cn(
        "group flex flex-col rounded-2xl bg-white text-left shadow-sm ring-1 ring-zinc-200/70 transition-shadow hover:shadow-md",
        tall ? "row-span-1" : "mt-2" // lain tinggi → grid tidak terasa pasif
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-t-2xl rounded-b-lg bg-zinc-100",
          tall ? "aspect-[4/5]" : "aspect-square"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105 group-active:scale-100"
        />
        {featured && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#18181B]/80 px-2 py-0.5 text-[10px] font-semibold text-[#FBFBFA]">
            <Star className="size-2.5 text-amber-300" aria-hidden />
            Pilihan
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-bold leading-snug text-[#18181B]">
          {item.name}
        </h3>
        <p className="line-clamp-2 text-xs text-zinc-500">
          {item.description}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-semibold text-[#18181B]">
            {formatRupiah(item.price)}
          </span>
          <span
            aria-label={`Tambah ${item.name}`}
            className="flex size-8 items-center justify-center rounded-full bg-[#4A5D4E] text-[#FBFBFA] transition-transform duration-150 active:scale-90"
          >
            <Plus className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
