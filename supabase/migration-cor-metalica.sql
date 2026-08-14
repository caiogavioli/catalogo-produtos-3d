-- Migração pro banco que já existe (rodar uma vez no SQL Editor do
-- Supabase). Adiciona a opção de marcar uma cor como "metálica" — os
-- círculos dela ganham um efeito de brilho em vez de cor lisa. Pode ser
-- rodado mais de uma vez sem erro.

alter table colors add column if not exists metallic boolean not null default false;
