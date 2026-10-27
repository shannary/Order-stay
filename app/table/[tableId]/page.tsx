import { Suspense } from "react";
import {
  MenuCatalog,
} from "@/components/catalog/menu-catalog";
import { TableSession } from "@/components/catalog/table-session";
import { SplashFallbackInner } from "@/components/catalog/splash-fallback";

/**
 * Halaman katalog pelanggan. Landing dari scan QR:
 * /table/{num}?tid={table_id} → TableSession menyimpan sesi meja
 * (cookie + localStorage) bersihkan ?tid.
 */
export default function TablePage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  return (
    <Suspense fallback={<SplashFallbackInner />}>
      <TableContent paramsPromise={params} />
    </Suspense>
  );
}

async function TableContent({
  paramsPromise,
}: {
  paramsPromise: Promise<{ tableId: string }>;
}) {
  const { tableId } = await paramsPromise;

  return (
    <>
      <TableSession tableNumber={tableId} />
      <MenuCatalog tableNumber={tableId} />
    </>
  );
}
