"use client";

import { useRef } from "react";
import { CATEGORIES } from "@/lib/mock-menu";
import { cn } from "@/lib/utils";

type CategoryTabsProps = {
  active: string;
  onChange: (categoryId: string) => void;
};

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="sticky top-[57px] z-30 bg-[#FBFBFA]/95 backdrop-blur"
    >
      <div className="mx-auto max-w-md overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <nav className="flex w-max gap-2" aria-label="Kategori menu">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onChange(category.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200",
                active === category.id
                  ? "bg-[#4A5D4E] text-[#FBFBFA]"
                  : "bg-zinc-200/60 text-[#18181B]/70 hover:bg-zinc-200"
              )}
            >
              {category.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
