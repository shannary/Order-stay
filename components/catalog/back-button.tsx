"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  label?: string;
  fallbackHref?: string;
  className?: string;
};

/** Tombol kembali: router.back() bila ada history, kalau tidak → fallbackHref. */
export function BackButton({
  label = "Kembali",
  fallbackHref = "/",
  className = "",
}: BackButtonProps) {
  const router = useRouter();

  const back = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={back}
      className={`flex items-center gap-1.5 text-sm font-semibold text-zinc-600 transition-colors hover:text-[#18181B] ${className}`}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
