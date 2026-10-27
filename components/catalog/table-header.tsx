"use client";

import { Coffee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TableHeaderProps = {
  cafeName: string;
  tableNumber: string;
};

export function TableHeader({ cafeName, tableNumber }: TableHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#FBFBFA]/95 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#4A5D4E]">
            <Coffee className="size-4 text-[#FBFBFA]" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#18181B]">
            {cafeName}
          </span>
        </div>
        <Badge
          variant="outline"
          className="rounded-full border-[#4A5D4E]/30 bg-[#4A5D4E]/10 px-3 py-1 text-xs font-semibold text-[#4A5D4E]"
        >
          Meja {tableNumber}
        </Badge>
      </div>
    </header>
  );
}
