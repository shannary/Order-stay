-- 1. Enable UUID extension (jika belum aktif)
create extension if not exists "uuid-ossp";

-- 2. Create Custom Enums
create type payment_status as enum ('pending', 'paid');
create type order_status as enum ('received', 'cooking', 'served', 'completed');

-- 3. Tabel: tables (Meja)
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  number int unique not null,
  label text,
  capacity int not null default 4,
  qr_token text unique not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. Tabel: menu_items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  category text not null,
  image_url text,
  is_available boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 5. Tabel: orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.tables(id) on delete restrict not null,
  order_number text unique not null,
  status order_status not null default 'received',
  payment_status payment_status not null default 'pending',
  payment_ref text,
  total_amount integer not null default 0 check (total_amount >= 0),
  created_at timestamptz default now(),
  paid_at timestamptz,
  completed_at timestamptz
);

-- 6. Tabel: order_items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete restrict not null,
  item_name text not null, -- Snapshot nama
  unit_price integer not null check (unit_price >= 0), -- Snapshot harga
  quantity int not null check (quantity > 0),
  notes text
);

-- 7. Enable Row Level Security (RLS)
alter table public.tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- 8. RLS Policies (Konsep Akses Publik & Admin)
-- Siapa saja (anon/pelanggan) bisa melihat meja yang aktif dan menu yang tersedia
create policy "Allow public read active tables" on public.tables for select using (is_active = true);
create policy "Allow public read available menu" on public.menu_items for select using (is_available = true);

-- Pelanggan (anon) dapat membuat pesanan baru
create policy "Allow anon insert orders" on public.orders for insert with check (true);
create policy "Allow anon insert order_items" on public.order_items for insert with check (true);

-- Pelanggan dapat melihat pesanan mereka sendiri (berdasarkan sesi aktif/order_id jika dipegang state-nya)
create policy "Allow public read own orders" on public.orders for select using (true);
create policy "Allow public read own order_items" on public.order_items for select using (true);

-- Catatan: Update status/payment (seperti konfirmasi kasir atau webhook Midtrans) 
-- akan dijalankan menggunakan service_role key di backend/API route, 
-- sehingga bypass RLS secara aman.