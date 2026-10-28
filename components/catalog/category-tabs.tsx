"use client";

import { useRef } from "react";
import { CATEGORIES } from "@/lib/mock-menu";
import { cn } from "@/lib/utils";

type CategoryTabsProps = {
  active: string;
  onChange: (categoryId: string) => void;
};

/** Emoji per kategori — tanda visual yang diproses cepat otak dibaca teks */
const ICONS: Record<string, string> = {
  all: "✨",
  coffee: "☕",
  "non-coffee": "🥤",
  food: "🍝",
  snacks: "🥐",
};

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={scrollRef} className="sticky top-[57px] z-30 bg-[#FBFBFA]/95 backdrop-blur">
      <div className="mx-auto max-w-md overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex w-max gap-2" aria-label="Kategori menu">
          {CATEGORIES.map((category) => {
            const isActive = active === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onChange(category.id)}
                aria-pressed={isActive}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
                  isActive
                    ? "scale-105 bg-[#4A5D4E] text-[#FBFBFA] shadow-md shadow-[#4A5D4E]/25"
                    : "bg-zinc-200/60 text-[#18181B]/70 hover:bg-zinc-200"
                )}
              >
                {ICONS[category.id] ?? "🍽️"}
                {category.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
