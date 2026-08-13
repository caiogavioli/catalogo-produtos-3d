-- Dados de exemplo pra ver o catálogo funcionando (rodar no SQL Editor
-- do Supabase, depois de já ter rodado schema.sql).
--
-- As fotos são placeholders (só o nome do produto escrito na imagem),
-- porque não foi possível confirmar links de fotos reais no ambiente
-- onde este script foi gerado. Troque pelas fotos de verdade quando
-- cadastrar os produtos reais pelo painel /admin — dá pra excluir estes
-- produtos de exemplo por lá também.

insert into categories (name, slug) values
  ('Pokémon', 'pokemon'),
  ('Decoração', 'decoracao'),
  ('Vasos', 'vasos'),
  ('Religião', 'religiao')
on conflict (slug) do nothing;

insert into products (name, slug, description, size, price, category_id) values
  (
    'Pikachu articulado', 'pikachu-articulado',
    'Impressão "print-in-place" articulada, sem montagem — sai da impressora já se mexendo.',
    '12cm', 45.00,
    (select id from categories where slug = 'pokemon')
  ),
  (
    'Pokébola decorativa', 'pokebola-decorativa',
    'Réplica em tamanho de mesa, com acabamento fosco e detalhes pintados à mão.',
    '8cm de diâmetro', 35.00,
    (select id from categories where slug = 'pokemon')
  ),
  (
    'Luminária geométrica', 'luminaria-geometrica',
    'Abajur de mesa com padrão vazado, efeito de luz pontilhada quando acesa. Não inclui lâmpada.',
    '20cm de altura', 89.90,
    (select id from categories where slug = 'decoracao')
  ),
  (
    'Organizador hexagonal', 'organizador-hexagonal',
    'Módulo empilhável pra mesa ou estante, várias cores disponíveis (ver página de cores).',
    '15x15x8cm', 39.90,
    (select id from categories where slug = 'decoracao')
  ),
  (
    'Vaso espiral', 'vaso-espiral',
    'Impresso em "vase mode" (parede única), acabamento liso e brilhante.',
    '18cm de altura', 55.00,
    (select id from categories where slug = 'vasos')
  ),
  (
    'Cachepot texturizado', 'cachepot-texturizado',
    'Textura em relevo, com furo de drenagem. Não inclui prato.',
    '14cm de diâmetro', 42.00,
    (select id from categories where slug = 'vasos')
  ),
  (
    'Terço de parede', 'terco-de-parede',
    'Peça decorativa vazada, pronta pra pendurar.',
    '25cm de comprimento', 49.90,
    (select id from categories where slug = 'religiao')
  ),
  (
    'Nossa Senhora — estatueta', 'nossa-senhora-estatueta',
    'Estatueta com base, acabamento fosco.',
    '20cm de altura', 65.00,
    (select id from categories where slug = 'religiao')
  )
on conflict (slug) do nothing;

insert into product_images (product_id, url, position)
select p.id, 'https://placehold.co/800x800/8b5cf6/ffffff?text=' || replace(p.name, ' ', '+'), 0
from products p
where p.slug in (
  'pikachu-articulado', 'pokebola-decorativa', 'luminaria-geometrica',
  'organizador-hexagonal', 'vaso-espiral', 'cachepot-texturizado',
  'terco-de-parede', 'nossa-senhora-estatueta'
)
and not exists (
  select 1 from product_images pi where pi.product_id = p.id
);
