/**
 * Klien Supabase sisi browser berbasis Cookie Storage (@supabase/ssr).
 * Sesi auth disimpan di cookie agar bisa diverifikasi oleh proxy.ts
 * saat mengakses rute /admin/*.
 * Untuk penggunaan data biasa (RLS/anon), tetap pakai lib/supabase.ts.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedBrowser: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (cachedBrowser) return cachedBrowser;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi di .env.local"
    );
  }

  cachedBrowser = createBrowserClient(url, anonKey);
  return cachedBrowser;
}
