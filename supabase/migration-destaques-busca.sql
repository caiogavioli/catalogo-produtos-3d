-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase). Adiciona: destaque manual, contagem de visualizações e
-- busca por nome. Pode ser rodado mais de uma vez sem erro.

alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists view_count integer not null default 0;

create extension if not exists "pg_trgm";
create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);

create or replace function increment_product_views(product_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update products set view_count = view_count + 1 where id = product_id;
$$;

grant execute on function increment_product_views(uuid) to anon, authenticated;
