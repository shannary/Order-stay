"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type CartBarProps = {
  totalItems: number;
  totalPrice: number;
  onCheckout: () => void;
};

export function CartBar({ totalItems, totalPrice, onCheckout }: CartBarProps) {
  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
        >
          <div className="mx-auto max-w-md">
            <button
              type="button"
              onClick={onCheckout}
              className="flex w-full items-center gap-3 rounded-2xl bg-[#18181B] px-4 py-3.5 shadow-lg shadow-zinc-900/20 transition-transform active:scale-[0.98]"
            >
              <span className="relative flex size-10 items-center justify-center rounded-full bg-[#4A5D4E]">
                <ShoppingBag className="size-4 text-[#FBFBFA]" aria-hidden />
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#FBFBFA] text-[10px] font-bold text-[#18181B]">
                  {totalItems}
                </span>
              </span>
              <span className="flex flex-col items-start text-[#FBFBFA]">
                <span className="text-[11px] text-zinc-400">
                  {totalItems} item{totalItems > 1 ? "s" : ""}
                </span>
                <span className="text-sm font-bold">
                  {formatRupiah(totalPrice)}
                </span>
              </span>
              <span className="ml-auto flex items-center gap-1 rounded-full bg-[#FBFBFA] px-4 py-2 text-sm font-semibold text-[#18181B]">
                Lanjut ke Checkout
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
