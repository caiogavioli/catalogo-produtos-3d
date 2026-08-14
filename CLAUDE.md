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
- Catálogo público, sem login, navegação por categoria, visual "vitrine" na
  identidade CMG3D (roxo/metálico, moderno). Produto mostra foto(s), nome,
  descrição, tamanho e preço (opcional, pode ficar em branco).
- Área admin com login para 2 usuários, mesma permissão total (CRUD de
  produtos e categorias).
- Página de cores disponíveis (lista geral, não é atributo por produto).

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

- Frontend: Next.js.
- Hospedagem: Vercel, domínio `*.vercel.app` gratuito.
- Banco de dados + autenticação + storage de imagens: Supabase (camada
  gratuita).

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
