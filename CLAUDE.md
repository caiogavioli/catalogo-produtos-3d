# CLAUDE.md

Contexto para qualquer sessão do Claude trabalhando neste repositório.

## O que é este projeto

Site da CMG3D com catálogo público (vitrine) dos produtos de impressão 3D e
uma área administrativa com login para o usuário e a esposa dele
cadastrarem/editarem produtos. Substitui a ideia original de gerar PDF —
agora o compartilhamento com clientes é feito por link do site.

Spec de origem (decisão completa, trade-offs, riscos): repositório
[caiogavioli/Brainstorm](https://github.com/caiogavioli/Brainstorm),
arquivo `projetos/catalogo-produtos-3d.md`.

## Escopo da v1

Entra:
- Catálogo público, sem login, navegação por categoria (menu no
  cabeçalho), visual "vitrine" na identidade CMG3D. Produto mostra
  foto(s), nome, descrição, tamanho e preço (opcional, pode ficar em
  branco).
- Área admin com login para 2 usuários, mesma permissão total (CRUD de
  produtos e categorias), incluindo checkbox "destacar" por produto e
  gestão das cores cadastradas (`/admin/cores`).
- Cores **não têm página pública própria** (decisão de 2026-08-14,
  substituiu a página `/cores` original). Cada produto tem
  `color_mode`: "única" (não mostra nada) ou "várias" (mostra círculos
  das cores escolhidas pra ele, na página do produto e na visualização
  rápida). A cor escolhida pelo cliente entra na mensagem do WhatsApp.
  Cor pode ser marcada como "metálica" no admin — o círculo ganha um
  brilho (gradiente claro/escuro sobre a cor base, `colorSwatchStyle`
  em `src/lib/colors.ts`) em vez de ficar lisa.
- Login do admin com "Esqueci minha senha" (`/admin/esqueci-senha` →
  e-mail do Supabase → `/auth/callback` → `/admin/redefinir-senha`).
  Exige o endereço do site na lista "Redirect URLs" do Supabase
  (Authentication > URL Configuration).
- Página admin `/admin/escolha`: dono e esposa marcam "Quero"/"Talvez"
  nos ~6,7 mil modelos do MakerWorld (lista estática em
  `public/dados/modelos-makerworld.json`) pra montar a seção "Sob
  encomenda". Marcações por usuário na tabela `model_picks`
  (`supabase/migration-escolha-modelos.sql`, já rodada em produção).
  Clicar "Quero" cria sozinho um **rascunho** de produto (`published =
  false`, invisível no site público) com o nome e a foto do MakerWorld
  copiada pro storage (`syncModelProduct` em `src/app/admin/actions.ts`;
  `products.makerworld_id` evita duplicar). Tenta trazer até 5 fotos do modelo (capa + extras lidas da API/página do MakerWorld, melhor esforço — se bloquear, fica só a capa); na edição do produto, "Usar como capa" escolhe a foto principal (posição 0) e "Buscar mais fotos do MakerWorld" tenta de novo. Descrição fica em branco —
  não há raspagem do MakerWorld. O dono completa categoria/cores/preço e
  marca "Publicado" na lista de produtos. Tirar o Quero apaga o
  rascunho só se ele não foi editado. Schema em
  `supabase/migration-rascunhos-makerworld.sql` (rodar ANTES do deploy:
  as consultas públicas filtram `published`).
- Página admin `/admin/gestao`: sistema de gestão do negócio (portado do
  artefato "CMG Gestão" em 2026-10-12), com abas Pedidos (com fila de
  impressão por impressora), Estoque de filamento, Preços (calculadora
  de custo/preço por Pix, débito e crédito), Clientes, Painel de vendas
  e Ajustes. Dados nas tabelas `gestao_*`
  (`supabase/migration-gestao.sql`, só os 2 admins acessam). Ligado ao
  catálogo: pedido e peça calculada podem apontar pra um produto do
  site (`product_id`), e a calculadora tem o botão "Usar no site" que
  grava o preço Pix no produto. Os números iniciais de Ajustes
  (impressoras, DAS, taxas) são **exemplos** até o dono trocar pelos
  reais. Código em `src/components/gestao/` e `src/lib/gestao.ts`.
- Busca por nome de produto (`/busca`), com paginação.
- Página de categoria com ordenação (recentes/preço) e paginação —
  necessário desde que o usuário avisou que o catálogo vai crescer pra
  centenas de produtos (2026-08-14).
- Home: banner/carrossel autoplay com os produtos marcados como
  "destacar" no admin; seção "Mais vistos" automática, por contagem de
  visualização (só aparece depois que algum produto tiver visualizações).
- Badge "Novo" automático em produtos cadastrados nos últimos 14 dias.
- "Visualização rápida" (modal) no card do produto, sem sair da listagem.
- Botão "Perguntar no WhatsApp" na página do produto e na visualização
  rápida — só aparece se `NEXT_PUBLIC_WHATSAPP_NUMBER` estiver
  configurado.

Não entra:
- Geração de PDF (descontinuada).
- Checkout/venda dentro do site.
- Domínio próprio pago — usa domínio gratuito do Vercel.
- Raspagem automática do MakerWorld — descartada (decisão de
  2026-08-13, ver `sessoes/` no repo Brainstorm): o ambiente de
  implementação não tinha acesso de rede ao MakerWorld pra sequer
  inspecionar a página, e o usuário preferiu cadastro manual pelo
  painel admin a depender de um raspador não testado contra site sem
  API oficial. As pastas `scraper/` e `data/` ficam como estavam
  (vazias) — se algum dia isso for retomado, é projeto à parte.

## Stack

- Frontend: Next.js, Framer Motion (animações), Lucide (ícones), fontes Geist e Space Grotesk.
- Hospedagem: Vercel, domínio `*.vercel.app` gratuito.
- Banco de dados + autenticação + storage de imagens: Supabase (camada
  gratuita).

### Mudanças de schema depois do primeiro deploy

`supabase/schema.sql` é a fonte da verdade pra um projeto Supabase novo,
mas **não** atualiza um banco que já existe (`create table if not
exists` não adiciona coluna em tabela já criada). Toda mudança de schema
feita depois do primeiro deploy também precisa de um arquivo de
migração separado em `supabase/` (ex.: `migration-destaques-busca.sql`,
`migration-cores-por-produto.sql`) pro usuário rodar manualmente no SQL
Editor do Supabase — não temos acesso automatizado ao banco de produção.

## Riscos conhecidos

- Camadas gratuitas (Vercel/Supabase) têm limites de uso — improvável de
  estourar no volume esperado, mas vale monitorar se crescer muito.
- Supabase gratuito **pausa o projeto sozinho depois de 7 dias sem
  atividade** — já causou um 504 `MIDDLEWARE_INVOCATION_TIMEOUT` real no
  `/admin` (2026-08-14), porque o middleware chama `auth.getUser()` a
  cada request e trava esperando um projeto pausado responder. Corrigido
  com um cron do Vercel (`vercel.json`) chamando `/api/keep-alive` 1x por
  dia — se o erro voltar a aparecer, checar primeiro se o cron está
  rodando (aba Cron Jobs no dashboard do Vercel) antes de investigar
  outra causa. Reserva: `.github/workflows/keep-alive.yml` chama a mesma
  rota 1x por dia pelo GitHub Actions (usa a variável `SITE_URL` do
  repositório; o GitHub desliga workflows agendados após 60 dias sem
  atividade no repo).
- Autenticação e hospedagem são peças que podem falhar — mais superfície de
  manutenção que um script local.
- Cadastro de produtos é 100% manual pelo painel admin (sem raspagem) —
  cadastrar muitos produtos de uma vez é trabalho repetitivo; aceito
  como troca pela simplicidade.

## Identidade visual

Marca CMG3D. Logo (roxo/metálico, tipografia bold angular, ilustração de
família) salvo em `public/logo.png`, usado no cabeçalho e no rodapé.

Histórico: a v3 (2026-08-14) tentou trocar o acento por âmbar + ciano e
**o usuário não gostou**, pediu pra voltar tudo pro roxo. Em 2026-10-12 ele
escolheu a "opção C" entre três propostas de redesign — **v5 (atual)**:

- **Roxo continua sendo o acento único.** Tokens em `src/app/globals.css`:
  `brand-300` foco/seleção, `brand-700` preenchimento de botão,
  `brand-800` hover, `brand-900` estado ativo. Dourado só aparece nas
  fotos dos produtos, nunca na interface.
- **Fundo roxo escuro** (`ink-950` #1a0a38) em vez do cinza-violeta da v4;
  `ink-*` inteiro foi puxado pra mais roxo. A home tem **uma** troca de
  tema deliberada: topo escuro e uma seção clara (`#f6f2fc`, texto
  `ink-950`) com cantos superiores arredondados. Não espalhar mais
  seções claras sem pedido.
- **Fontes:** Space Grotesk nos títulos (`h1`-`h3`, variável
  `--font-heading`, tracking apertado) e Geist no corpo. Não usa mais
  Inter.
- **Home:** topo é **só o carrossel** autoplay (`hero-carousel.tsx`) com
  os produtos marcados "destacar" (ou os 5 mais recentes, se nenhum);
  o usuário não gostou do topo com texto + disco (2026-10-12). Abaixo,
  faixa horizontal "Escolha a sua", categorias em linhas grandes, "Mais
  vistos" (automático) e bloco de contato por WhatsApp.
- **Cards de produto:** título limitado a 2 linhas com altura mínima,
  pra cards lado a lado terem o mesmo tamanho.
- **Várias cores:** ao escolher "Várias cores" num produto sem cor
  nenhuma, todas as cores cadastradas já vêm marcadas (form e lista).
- Preço continua em fonte monoespaçada (`font-mono`); ícones Lucide.
- Páginas internas (categoria, produto, busca, admin) herdam só as cores
  e fontes novas; o layout delas não foi redesenhado.

## Convenções

- Idioma: português do Brasil, em código, commits e documentação.
- Sem abstração prematura — é uso pessoal/familiar, não produto para
  terceiros administrarem.
