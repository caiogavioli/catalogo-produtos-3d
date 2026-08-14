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
  produtos e categorias), incluindo checkbox "destacar" por produto.
- Página de cores disponíveis (lista geral, não é atributo por produto).
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
migração separado em `supabase/` (ex.: `migration-destaques-busca.sql`)
pro usuário rodar manualmente no SQL Editor do Supabase — não temos
acesso automatizado ao banco de produção.

## Riscos conhecidos

- Camadas gratuitas (Vercel/Supabase) têm limites de uso — improvável de
  estourar no volume esperado, mas vale monitorar se crescer muito.
- Autenticação e hospedagem são peças que podem falhar — mais superfície de
  manutenção que um script local.
- Cadastro de produtos é 100% manual pelo painel admin (sem raspagem) —
  cadastrar muitos produtos de uma vez é trabalho repetitivo; aceito
  como troca pela simplicidade.

## Identidade visual

Marca CMG3D. Logo fornecido pelo usuário — roxo/metálico, tipografia bold
angular, ilustração de família na composição (ainda não salvo como
arquivo no repo). Visual do site (redefinido em 2026-08-14, a pedido do
usuário): tema **escuro** ("cinza chumbo"), acento **roxo metálico** (cor
da marca — testado brevemente com cobre/laranja, revertido no mesmo dia
a pedido do usuário), cartões com leve efeito vidro (glass, `bg-ink-900`
translúcido + blur), fonte Inter, ícones Lucide, pequenas animações de
entrada/hover com Framer Motion, menu de categorias no cabeçalho. Tokens
de cor em `src/app/globals.css` (`ink-*` = superfícies/texto em cinza
chumbo, `brand-*` = acento roxo). Ajustar quando o logo real virar
arquivo — pode influenciar o tom exato do roxo.

## Convenções

- Idioma: português do Brasil, em código, commits e documentação.
- Sem abstração prematura — é uso pessoal/familiar, não produto para
  terceiros administrarem.
