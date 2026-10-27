import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  MenuInvalidSplash,
} from "@/components/catalog/menu-invalid-splash";
import { SplashFallbackInner } from "@/components/catalog/splash-fallback";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Gerbang wajib-scan: QR meja mengarah ke /m/{qr_token}.
 * Token valid →_redirect ke /table/{number}?tid={table_id}
 * (tid menyetel sesi meja). Token tidak dikenal → splash invalid.
 */
export default function MenuTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={<SplashFallbackInner />}>
      <TokenResolver tokenPromise={params} />
    </Suspense>
  );
}

async function TokenResolver({
  tokenPromise,
}: {
  tokenPromise: Promise<{ token: string }>;
}) {
  const { token } = await tokenPromise;

  let table: {
    id: string;
    number: number;
    is_active: boolean;
  } | null = null;
  try {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("tables")
      .select("id, number, is_active")
      .eq("qr_token", token)
      .maybeSingle();
    const row = (data as unknown as {
      id: string;
      number: number | null;
      is_active: boolean | null;
    } | null) ?? null;
    table = row && row.is_active !== false ? {
      id: row.id,
      number: row.number ?? 0,
      is_active: true,
    } : null;
  } catch {
    // Supabase env belum diisi → anggap token tidak dikenal
  }

  if (!table) {
    return <MenuInvalidSplash />;
  }

  redirect(`/table/${table.number}?tid=${table.id}`);
}
