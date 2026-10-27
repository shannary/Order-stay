import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// TODO: ganti `any` dengan type `Database` hasil generate dari Supabase CLI
// (npx supabase gen types typescript --project-id <id> --schema public > supabase/database.types.ts)
export type Database = any;

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Klien Supabase untuk sisi browser (Client Components).
 * Menggunakan anon key — akses dikendalikan oleh Row Level Security.
 * Instansinya di-cache agar tidak dibuat ulang pada setiap render/hot-reload.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib diisi di .env.local"
    );
  }

  cachedClient = createClient<Database>(url, anonKey);
  return cachedClient;
}

// Instance siap pakai untuk Client Components:
export const supabase = (() => {
  try {
    return getSupabaseClient();
  } catch {
    // Build-time / lingkungan tanpa env masih bisa melakukan render statis
    return null as unknown as SupabaseClient<Database>;
  }
})();
