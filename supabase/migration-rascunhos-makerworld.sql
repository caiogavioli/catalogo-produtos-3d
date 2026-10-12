-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase, ANTES de publicar a versão do site que usa essas colunas).
-- Produtos criados a partir da página /admin/escolha nascem como
-- rascunho (published = false): só aparecem pros admins logados, até
-- alguém marcar "Publicado" na lista de produtos. makerworld_id guarda de
-- qual modelo do MakerWorld o produto veio (evita duplicar). Pode ser
-- rodado mais de uma vez sem erro.

alter table products add column if not exists published boolean not null default true;
alter table products add column if not exists makerworld_id bigint;

create unique index if not exists products_makerworld_id_key
  on products (makerworld_id) where makerworld_id is not null;

-- Leitura pública só dos publicados; os admins logados enxergam tudo.
drop policy if exists "leitura pública" on products;
create policy "leitura pública" on products for select
  using (published or auth.role() = 'authenticated');
