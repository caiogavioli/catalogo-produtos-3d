-- Schema do catálogo CMG3D.
-- Rodar no SQL Editor do painel do Supabase (projeto novo, vazio).

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  size text,
  price numeric(10, 2),
  category_id uuid references categories (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  url text not null,
  position integer not null default 0
);

create table if not exists colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex text
);

create index if not exists products_category_id_idx on products (category_id);
create index if not exists product_images_product_id_idx on product_images (product_id);

-- updated_at automático em products
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- RLS: catálogo é público para leitura; escrita só para usuários autenticados
-- (as duas contas admin, criadas manualmente no painel Auth do Supabase).
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table colors enable row level security;

drop policy if exists "leitura pública" on categories;
drop policy if exists "leitura pública" on products;
drop policy if exists "leitura pública" on product_images;
drop policy if exists "leitura pública" on colors;

create policy "leitura pública" on categories for select using (true);
create policy "leitura pública" on products for select using (true);
create policy "leitura pública" on product_images for select using (true);
create policy "leitura pública" on colors for select using (true);

drop policy if exists "escrita autenticada" on categories;
drop policy if exists "escrita autenticada" on products;
drop policy if exists "escrita autenticada" on product_images;
drop policy if exists "escrita autenticada" on colors;

create policy "escrita autenticada" on categories for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "escrita autenticada" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "escrita autenticada" on product_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "escrita autenticada" on colors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage: bucket público para fotos de produto.
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

drop policy if exists "leitura pública das fotos" on storage.objects;
drop policy if exists "upload autenticado de fotos" on storage.objects;
drop policy if exists "remoção autenticada de fotos" on storage.objects;

create policy "leitura pública das fotos" on storage.objects for select
  using (bucket_id = 'produtos');

create policy "upload autenticado de fotos" on storage.objects for insert
  with check (bucket_id = 'produtos' and auth.role() = 'authenticated');

create policy "remoção autenticada de fotos" on storage.objects for delete
  using (bucket_id = 'produtos' and auth.role() = 'authenticated');
