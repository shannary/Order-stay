import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

/**
 * Klien Supabase khusus server (API Route / Server Actions).
 * Memakai SUPABASE_SERVICE_ROLE_KEY sehingga bypass RLS —
 * hanya dipakai di server, JANGAN pernah ekespos ke client bundle.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local (hanya untuk server)"
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
