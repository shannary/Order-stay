import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuCatalog } from "@/components/catalog/menu-catalog";
import { TableSession } from "@/components/catalog/table-session";
import { CAFE_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: `Menu · ${CAFE_NAME}`,
  description: "Pesan lewat QR, tanpa antre",
};

export default function TableMenuPage({
  params,
}: PageProps<"/table/[tableId]">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#FBFBFA] p-6 text-sm text-zinc-500">
          Memuat menu…
        </div>
      }
    >
      <TableMenuContent params={params} />
    </Suspense>
  );
}

async function TableMenuContent({
  params,
}: {
  params: PageProps<"/table/[tableId]">["params"];
}) {
  const { tableId } = await params;
  // TODO: fetch nama meja dari Supabase berdasarkan tableId/qr_token
  const tableNumber = decodeURIComponent(tableId).replace(/^meja-?/i, "") || "1";

  return (
    <>
      <Suspense fallback={null}>
        <TableSession tableNumber={tableNumber} />
      </Suspense>
      <MenuCatalog tableNumber={tableNumber} />
    </>
  );
}
