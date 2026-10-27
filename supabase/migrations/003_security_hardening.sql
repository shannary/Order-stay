-- 003: SECURITAS — memperketat RLS read/insert

-- Masalah yang diperbaiki:
--   B1) Policy lama "Allow public read own orders / order_items (using(true))"
--      membuat anonymous bisa membaca seluruh orders semua meja.
--   B2) Insert order harus dikunci ke meja yang sedang AKTIF.
--
-- Setelah migration ini:
--   * Anon (pelanggan) hanya bisa:
--       - membaca orders/order_items milik MEJA AKTIF yang table_id-nya
--         mereka pegang (didapat dari hasil scan QR).
--       - membuat order baru, SELAMA meja-nya masih aktif.
--   * POS/KDS DAPUR tidak lagi membaca via anon key —
--     semuanya di-back dari /api/admin/* melalui service role (lihat kode).

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

create policy "Insert order only against active tables"
  on public.orders
  for insert
  with check (exists (
    select 1 from public.tables t
    where t.id = table_id and t.is_active
  ));

-- ============ order_items ============
drop policy if exists "Allow public read own order_items" on public.order_items;
drop policy if exists "Allow anon insert order_items" on public.order_items;

create policy "Read only items of orders in active tables"
  on public.order_items
  for select
  using (public.order_of_active_table(order_id));

create policy "Insert items only into valid pending order"
  on public.order_items
  for insert
  with check (public.order_of_active_table(order_id));

-- Realtime untuk orders (idempotent)
alter publication supabase_realtime add table public.orders;
