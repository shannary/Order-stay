"use client";

import Link from "next/link";
import { QrCode, Home } from "lucide-react";
import { CAFE_NAME } from "@/lib/config";

export function MenuInvalidSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#FBFBFA] px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-red-100">
        <QrCode className="size-9 text-red-500" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-bold text-[#18181B]">Meja Tidak Valid</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
          Akses ke menu harus melalui scan QR di meja. Silakan kembali dan
          scan QR pada meja Anda di {CAFE_NAME}.
        </p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full bg-[#4A5D4E] px-5 py-2.5 text-sm font-semibold text-[#FBFBFA]"
      >
        <Home className="size-4" aria-hidden />
        Kembali ke Beranda
      </Link>
    </div>
  );
}
