"use client";

import { QrCode } from "lucide-react";

export function MenuInvalidSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#FBFBFA] px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-red-100">
        <QrCode className="size-9 text-red-500" aria-hidden />
      </span>
      <div>
        <h1 className="text-xl font-bold text-[#18181B]">Meja Tidak Valid</h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
          QR meja ini tidak valid atau sudah kadaluwarsa. Silakan scan ulang QR
          di meja Anda atau minta bantuan barista.
        </p>
      </div>
    </div>
  );
}
