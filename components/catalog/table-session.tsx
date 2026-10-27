"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Persist sesi meja: menerima `?tid=<table_id>` dari hasil scan QR,
 * lalu menyimpan table_id + table_number ke localStorage dan cookie.
 * Param URL dibersihkan setelah tersimpan (tanpa navigasi ulang).
 */
export function TableSession({ tableNumber }: { tableNumber: string }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tid = searchParams.get("tid");
    if (!tid) return;

    const maxAge = 60 * 60 * 6; // sesi meja berlaku 6 jam
    document.cookie = `table_id=${tid}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `table_number=${tableNumber}; path=/; max-age=${maxAge}; samesite=lax`;

    try {
      localStorage.setItem(
        "table_session",
        JSON.stringify({ tableId: tid, tableNumber, savedAt: Date.now() })
      );
    } catch {
      // localStorage tidak tersedia (mis. mode privat) — cookie sudah cukup
    }

    // Bersihkan ?tid= agar tidak ikut ditempel saat share/link
    const url = new URL(window.location.href);
    url.searchParams.delete("tid");
    window.history.replaceState(null, "", url.toString());
  }, [tableNumber, searchParams]);

  return null;
}
