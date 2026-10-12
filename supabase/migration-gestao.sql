-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase, ANTES de publicar a versão do site com /admin/gestao).
-- Cria as tabelas do sistema de gestão (pedidos, clientes, estoque de
-- filamento, peças com preço calculado e ajustes). Só quem está logado
-- (os 2 admins) lê e escreve; o site público não enxerga nada disso.
-- Pode ser rodado mais de uma vez sem erro.

create table if not exists gestao_config (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

create table if not exists gestao_filaments (
  id uuid primary key default gen_random_uuid(),
  marca text not null default '',
  tipo text not null default 'PLA',
  cor text not null default '',
  hex text not null default '#8a5cd1',
  inicial numeric not null default 1000,
  restante numeric not null default 1000,
  kg numeric not null default 0,
  minimo numeric not null default 200,
  created_at timestamptz not null default now()
);

create table if not exists gestao_clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text not null default '',
  notas text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists gestao_pieces (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  pix numeric not null default 0,
  deb numeric not null default 0,
  cred numeric not null default 0,
  custo numeric not null default 0,
  inp jsonb,
  product_id uuid references products (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists gestao_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references gestao_clients (id) on delete set null,
  product_id uuid references products (id) on delete set null,
  filament_id uuid references gestao_filaments (id) on delete set null,
  canal text not null default 'Instagram',
  item text not null,
  qtd integer not null default 1,
  preco numeric not null default 0,
  pagamento text not null default 'Pix',
  status text not null default 'Novo',
  impressora text not null default '',
  urgente boolean not null default false,
  horas numeric not null default 0,
  gramas numeric not null default 0,
  custo numeric not null default 0,
  prazo date,
  pago boolean not null default false,
  notas text not null default '',
  baixado boolean not null default false,
  created_at timestamptz not null default now()
);

alter table gestao_config enable row level security;
alter table gestao_filaments enable row level security;
alter table gestao_clients enable row level security;
alter table gestao_pieces enable row level security;
alter table gestao_orders enable row level security;

drop policy if exists "só admins" on gestao_config;
drop policy if exists "só admins" on gestao_filaments;
drop policy if exists "só admins" on gestao_clients;
drop policy if exists "só admins" on gestao_pieces;
drop policy if exists "só admins" on gestao_orders;

create policy "só admins" on gestao_config for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "só admins" on gestao_filaments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "só admins" on gestao_clients for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "só admins" on gestao_pieces for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "só admins" on gestao_orders for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
