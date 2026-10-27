import type { Metadata } from "next";
import { Suspense } from "react";
import { CAFE_NAME } from "@/lib/config";
import { redirect } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { MenuInvalidSplash } from "@/components/catalog/menu-invalid-splash";
import { SplashFallbackInner } from "@/components/catalog/splash-fallback";

export const metadata: Metadata = {
  title: `Meja Tidak Valid · ${CAFE_NAME}`,
};

export default function QrTablePage({ params }: PageProps<"/m/[token]">) {
  return (
    <Suspense fallback={<SplashFallbackInner />}>
      <QrTableContent params={params} />
    </Suspense>
  );
}

async function QrTableContent({
  params,
}: {
  params: PageProps<"/m/[token]">["params"];
}) {
  const { token } = await params;
  const qrToken = decodeURIComponent(token);

  // Lookup meja berdasarkan qr_token.
  // Anon key aman di sini: RLS hanya memperbolehkan read tabel aktif.
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("tables")
    .select("id, number")
    .eq("qr_token", qrToken)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return <MenuInvalidSplash />;
  }

  redirect(
    `/table/${data.number}?tid=${encodeURIComponent(data.id as string)}`
  );
}
