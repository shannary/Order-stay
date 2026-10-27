import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { MenuCatalog } from "@/components/catalog/menu-catalog";
import { TableSession } from "@/components/catalog/table-session";
import { MenuInvalidSplash } from "@/components/catalog/menu-invalid-splash";
import { CAFE_NAME } from "@/lib/config";
import { getSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: `Menu · ${CAFE_NAME}`,
  description: "Pesan lewat QR, tanpa antre",
};

export default function TableMenuPage({
  params,
  searchParams,
}: PageProps<"/table/[tableId]">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#FBFBFA] p-6 text-sm text-zinc-500">
          Memuat menu…
        </div>
      }
    >
      <TableMenuContent
        params={params as unknown as Promise<{ tableId: string }>}
        searchParams={searchParams as unknown as Promise<Record<string, string | string[] | undefined>>}
      />
    </Suspense>
  );
}

/**
 * ANTI-BYPASS:
 * Akses langsung ke /table/{nomor} TANPA hasil scan QR
 * (tidak ada cookie table_id ATAU ?tid yang valid) → splash
 * "Meja Tidak Valid" dan keluar dari halaman menu.
 */
async function TableMenuContent({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ tableId: urlId }, sp, cookieStore] = await Promise.all([
    params,
    searchParams,
    cookies(),
  ]);

  const fromUrl = decodeURIComponent(String(urlId)).replace(/^meja-?/i, "");
  const expectedNumber = Number(fromUrl) || 0;

  const tidParam = typeof sp.tid === "string" ? sp.tid : undefined;
  const cookieTableId = cookieStore.get("table_id")?.value;
  const uuidRe = /^[0-9a-f-]{36}$/i;

  // Kandidat table_id: ?tid (dari redirect /m/{token}) → cookie sesi lama
  const candidate = (tidParam ?? cookieTableId) as string | undefined;
  if (!candidate || !uuidRe.test(candidate)) {
    return <MenuInvalidSplash />;
  }

  // Verifikasi ke DB: meja harus aktif DAN nomor cocok dengan URL
  const { data: table } = await getSupabaseClient()
    .from("tables")
    .select("id, number")
    .eq("id", candidate)
    .eq("is_active", true)
    .maybeSingle();

  if (!table || (table as { number: number }).number !== expectedNumber) {
    return <MenuInvalidSplash />;
  }

  return (
    <>
      <Suspense fallback={null}>
        <TableSession tableNumber={String(expectedNumber)} />
      </Suspense>
      <MenuCatalog tableNumber={String(expectedNumber)} />
    </>
  );
}
