"use client";
import { CAFE_NAME } from "@/lib/config";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus, QrCode, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { QrStickerModal } from "@/components/admin/qr-sticker-modal";
import { BackButton } from "@/components/catalog/back-button";

type Table = {
  id: string;
  number: number;
  label: string | null;
  qr_token: string;
  is_active: boolean;
  capacity: number;
};

export function TablesAdminClient() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [origin, setOrigin] = useState("");
  const [printTable, setPrintTable] = useState<Table | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tables");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTables(data.tables as Table[]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat meja"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    setOrigin(window.location.origin);
  }, [refetch]);

  const addTable = async () => {
    setAdding(true);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: Number(number),
          label: label || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Meja ${number} ditambahkan`);
      setNumber("");
      setLabel("");
      setTables((prev) =>
        [...prev, data.table as Table].sort((a, b) => a.number - b.number)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambah meja");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-xl bg-[#FBFBFA] p-4 pb-10 md:p-8">
      <div className="mb-2">
        <BackButton fallbackHref="/" label="Beranda" />
      </div>
      <header className="mb-6">
        <h1 className="text-lg font-bold text-[#18181B]">Admin · Meja</h1>
        <p className="text-xs text-zinc-500">
          Daftar meja & kode QR untuk pelanggan
        </p>
      </header>

      {/* Form tambah meja */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void addTable();
        }}
        className="mb-6 flex gap-2"
      >
        <Input
          type="number"
          min={1}
          max={9999}
          placeholder="No. meja"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="w-24 shrink-0 rounded-xl bg-white"
          required
        />
        <Input
          type="text"
          placeholder="Label (opsional), cth. Teras"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-xl bg-white"
        />
        <Button
          type="submit"
          disabled={adding || !number}
          className="shrink-0 gap-1.5 rounded-xl bg-[#4A5D4E] px-4 text-sm font-semibold text-[#FBFBFA] hover:bg-[#4A5D4E]/90"
        >
          {adding ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          Tambah
        </Button>
      </form>

      {loading && tables.length === 0 ? (
        <div className="flex items-center justify-center gap-2 pt-16 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Memuat…
        </div>
      ) : tables.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          Belum ada meja. Tambahkan meja pertama Anda.
        </p>
      ) : (
        <ul className="space-y-3">
          {tables.map((table) => {
            const qrUrl = `${origin}/m/${table.qr_token}`;
            return (
              <li
                key={table.id}
                className="flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200"
              >
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#4A5D4E]/10 font-bold text-[#4A5D4E]">
                  <span className="text-[10px] font-medium uppercase">
                    Meja
                  </span>
                  {table.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#18181B]">
                    {table.label || `Meja ${table.number}`}
                  </p>
                  <p className="truncate font-mono text-[11px] text-zinc-400">
                    {table.qr_token}
                  </p>
                  <Link
                    href={`/m/${table.qr_token}`}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#4A5D4E] underline-offset-2 hover:underline"
                  >
                    <QrCode className="size-3" aria-hidden />
                    Simulasi masuk sebagai pelanggan
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPrintTable(table)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-[#18181B] underline-offset-2 hover:underline"
                  >
                    <Printer className="size-3" aria-hidden />
                    Cetak Stiker QR
                  </button>
                </div>
                <div className="shrink-0 rounded-lg bg-white p-1.5 ring-1 ring-zinc-100">
                  <QRCode
                    value={qrUrl}
                    size={56}
                    style={{ height: 56, width: 56 }}
                    bgColor="#FFFFFF"
                    fgColor="#18181B"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal stiker siap cetak */}
      {printTable && origin && (
        <QrStickerModal
          open
          tableNumber={printTable.number}
          qrUrl={`${origin}/m/${printTable.qr_token}`}
          cafeName={CAFE_NAME}
          onClose={() => setPrintTable(null)}
        />
      )}
    </div>
  );
}
