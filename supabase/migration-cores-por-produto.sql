-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase, depois de schema.sql e migration-destaques-busca.sql).
-- Troca a página pública de cores por círculos de cor na página de cada
-- produto: "Cor única" (nada aparece) ou "Várias cores" (mostra as cores
-- escolhidas no admin pra esse produto). Pode ser rodado mais de uma vez
-- sem erro.

alter table products add column if not exists color_mode text not null default 'unica';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_color_mode_check'
  ) then
    alter table products add constraint products_color_mode_check
      check (color_mode in ('unica', 'varias'));
  end if;
end $$;

create table if not exists product_colors (
  product_id uuid not null references products (id) on delete cascade,
  color_id uuid not null references colors (id) on delete cascade,
  primary key (product_id, color_id)
);

create index if not exists product_colors_color_id_idx on product_colors (color_id);

alter table product_colors enable row level security;

drop policy if exists "leitura pública" on product_colors;
create policy "leitura pública" on product_colors for select using (true);

drop policy if exists "escrita autenticada" on product_colors;
create policy "escrita autenticada" on product_colors for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
