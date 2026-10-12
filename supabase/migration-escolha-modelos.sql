-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase). Cria a tabela das marcações "Quero" / "Talvez" da página
-- /admin/escolha, onde o dono e a esposa escolhem modelos do MakerWorld
-- pra seção "Sob encomenda". Cada pessoa tem a sua própria marcação por
-- modelo, e as duas aparecem pros dois. Pode ser rodado mais de uma vez.

create table if not exists model_picks (
  model_id bigint not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  user_email text,
  status text not null check (status in ('q', 't')),
  updated_at timestamptz not null default now(),
  primary key (model_id, user_id)
);

alter table model_picks enable row level security;

-- Só quem está logado (os 2 admins) lê; cada um só mexe nas próprias marcações.
drop policy if exists "leitura autenticada" on model_picks;
create policy "leitura autenticada" on model_picks for select
  using (auth.role() = 'authenticated');

drop policy if exists "escrita própria" on model_picks;
create policy "escrita própria" on model_picks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
