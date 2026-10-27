-- 002: Metode pembayaran + approval antrean dapur
-- payment_method: text bebas ("cash", "qris", ...)
-- is_approved: gerbang antrean dapur.
--   Attendant/kasir set true saat pesanan cash di-approve,
--   atau otomatis true saat payment_status = 'paid' (Midtrans).
-- Beroperasi: antrean dapur HANYA menampilkan
--   status='received' AND is_approved=true

alter table public.orders
  add column payment_method text not null default 'cash';

alter table public.orders
  add column is_approved boolean not null default false;

-- Index untuk query antrean dapur (dan admin)
create index orders_queue_idx
  on public.orders (status, is_approved, created_at);

-- Approved otomatis begitu dibayar
create or replace function public.auto_approve_on_paid()
returns trigger
language plpgsql
as $$
begin
  if new.payment_status = 'paid' and not new.is_approved then
    new.is_approved := true;
  end if;
  return new;
end;
$$;

create trigger orders_auto_approve
  before update on public.orders
  for each row execute function public.auto_approve_on_paid();
