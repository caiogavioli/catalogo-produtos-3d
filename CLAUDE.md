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

- Frontend: Next.js, Framer Motion (animações), Lucide (ícones).
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
  outra causa.
- Autenticação e hospedagem são peças que podem falhar — mais superfície de
  manutenção que um script local.
- Cadastro de produtos é 100% manual pelo painel admin (sem raspagem) —
  cadastrar muitos produtos de uma vez é trabalho repetitivo; aceito
  como troca pela simplicidade.

## Identidade visual

Marca CMG3D. Logo fornecido pelo usuário — roxo/metálico, tipografia bold
angular, ilustração de família na composição (ainda não salvo como
arquivo no repo).

Visual do site passou por duas rodadas no mesmo dia (2026-08-14). A v3
testou uma pesquisa de mercado em catálogos de impressão 3D (MakerWorld,
Printables, Bambu Store) que apontou o roxo-sobre-preto-com-glass como
clichê genérico de SaaS — tentou trocar o acento por âmbar + ciano,
reservando o roxo só pra 3 pontos de identidade. **O usuário não gostou**
e pediu pra voltar tudo pro roxo. v4 (atual), estável:

- **Roxo metálico é o acento único do site inteiro** de novo — preço,
  botões de ação, badge "Novo", links, foco e seleção. `brand-300`
  (tom mais claro) marca foco/seleção; `brand-700` é o preenchimento
  sólido de botão; `brand-900` marca estado ativo mais forte (ex.: aba
  de ordenação selecionada). Tudo dentro da mesma família — não separar
  de novo em acentos de cores diferentes sem pedido explícito.
- **Cinza metálico** (`steel-*`) é a segunda voz, não um acento novo —
  usado com moderação em texto técnico (ficha técnica do produto, rótulo
  "(metálica)" no admin).
- `ink-*` (superfícies/texto) tem uma leve nuance violeta-acinzentada em
  vez de cinza puro, pra combinar com o roxo em vez de competir.
- Sem glassmorphism — `.glass-card` (nome mantido por história) é
  superfície sólida com um gradiente sutil de "metal escovado", não
  vidro/blur.
- Preço em fonte monoespaçada (`font-mono`), lendo como dado técnico.

Fonte Inter (corpo/UI), ícones Lucide, pequenas animações de
entrada/hover com Framer Motion, menu de categorias no cabeçalho. Tokens
de cor em `src/app/globals.css`. Ajustar quando o logo real virar
arquivo — pode influenciar o tom exato do roxo.

## Convenções

- Idioma: português do Brasil, em código, commits e documentação.
- Sem abstração prematura — é uso pessoal/familiar, não produto para
  terceiros administrarem.
