"use client";

import { Printer, X } from "lucide-react";
import QRCode from "react-qr-code";
import { Coffee } from "lucide-react";
import { CAFE_TAGLINE } from "@/lib/config";

type QrStickerModalProps = {
  tableNumber: number;
  qrUrl: string;
  cafeName: string;
  open: boolean;
  onClose: () => void;
};

export function QrStickerModal({
  tableNumber,
  qrUrl,
  cafeName,
  open,
  onClose,
}: QrStickerModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#18181B]/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Toolbar — tersembunyi saat print */}
      <div className="no-print absolute right-6 top-6 flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-full bg-[#4A5D4E] px-4 py-2 text-sm font-semibold text-[#FBFBFA]"
        >
          <Printer className="size-4" aria-hidden />
          Cetak
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex items-center justify-center rounded-full bg-white p-2 text-[#18181B]"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {/* Stiker — area yang dicetak */}
      <div className="print-sticker bg-white rounded-2xl border-8 border-double border-[#18181B] px-10 py-8 text-center shadow-xl">
        {/* Nama kafe */}
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#4A5D4E]">
            <Coffee className="size-4 text-[#FBFBFA]" aria-hidden />
          </span>
          <p className="text-xl font-bold tracking-tight text-[#18181B]">
            {cafeName}
          </p>
        </div>

        {/* Nomor meja besar */}
        <p
          data-role="table-number"
          className="mt-4 text-7xl font-black leading-none tracking-tight text-[#18181B]"
        >
          {tableNumber}
        </p>
        <p
          data-role="table-label"
          className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#4A5D4E]"
        >
          Meja
        </p>

        {/* QR resolusi tinggi */}
        <div className="mx-auto mt-5 w-fit rounded-lg bg-white">
          <QRCode
            value={qrUrl}
            size={220}
            style={{ height: 220, width: 220 }}
            bgColor="#FFFFFF"
            fgColor="#18181B"
          />
        </div>

        <p data-role="qr-guide" className="mt-4 text-base font-bold text-[#18181B]">
          Scan untuk Pesan
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">{CAFE_TAGLINE}</p>
      </div>
    </div>
  );
}
