-- 003: SECURITAS — memperketat RLS read/insert

-- Masalah yang diperbaiki:
--   B1) Policy lama read (using(true)) = anonymous membaca seluruh orders.
--   B2) ANON INSERT via REST langsung (POST /rest/v1/orders dengan anon key)
--      dapat mengarang total_amount murah → ditutup total.
--   B3) Insert kunci ke meja AKTIF.
--
-- Setelah migration ini:
--   * Anon HANYA bisa membaca order milik meja aktif yang table_id-nya
--     mereka pegang (dari hasil scan QR).
--   * ANON TIDAK BISA insert orders/order_items sama sekali —
--     semua tulisan lewat /api/orders/create & /api/admin/* (service role).

-- ============ Helper SECURITY DEFINER ============
-- Satu-satunya jalur anon menyentuh orders dengan klausa lebih lebar.
create or replace function public.order_of_active_table(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    join public.tables t on t.id = o.table_id
    where o.id = p_order_id
      and t.is_active
  );
$$;

-- ============ orders ============
drop policy if exists "Allow public read own orders" on public.orders;
drop policy if exists "Allow anon insert orders" on public.orders;

create policy "Read only orders of active tables"
  on public.orders
  for select
  using (public.order_of_active_table(id));

-- INSERT via anon DITUTUP: tulis hanya dari service role (API server).
-- (tanpa policy insert untuk role anon/authenticated)

-- ============ order_items ============
drop policy if exists "Allow public read own order_items" on public.order_items;
drop policy if exists "Allow anon insert order_items" on public.order_items;

create policy "Read only items of orders in active tables"
  on public.order_items
  for select
  using (public.order_of_active_table(order_id));

-- INSERT via anon DITUTUP sama seperti orders.

-- ============ tables: sembunyikan qr_token dari anon ============
-- Tanpa ini, GET /rest/v1/tables (anon) menemukan qr_token SEMUA meja
-- → bypass seluruh flow "wajib scan". Kolom qr_token hanya dibaca
-- via service role (admin API).
revoke select (qr_token) on public.tables from anon, authenticated;

-- Realtime untuk orders (idempotent)
alter publication supabase_realtime add table public.orders;
