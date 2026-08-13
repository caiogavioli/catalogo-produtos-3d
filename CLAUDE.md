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
- Raspagem do MakerWorld para popular produtos inicialmente; edição
  posterior é manual pelo painel admin.

Não entra:
- Geração de PDF (descontinuada).
- Checkout/venda dentro do site.
- Domínio próprio pago — usa domínio gratuito do Vercel.
- Atualização automática/agendada da raspagem.

## Stack

- Frontend: Next.js.
- Hospedagem: Vercel, domínio `*.vercel.app` gratuito.
- Banco de dados + autenticação + storage de imagens: Supabase (camada
  gratuita).
- Raspagem: script (Python ou Node) contra o MakerWorld, rodado sob
  demanda, sem API pública disponível.

## Riscos conhecidos

- MakerWorld não tem API pública: raspagem pode quebrar se o layout mudar.
- Camadas gratuitas (Vercel/Supabase) têm limites de uso — improvável de
  estourar no volume esperado, mas vale monitorar se crescer muito.
- Autenticação e hospedagem são peças que podem falhar — mais superfície de
  manutenção que um script local.

## Identidade visual

Marca CMG3D. Logo fornecido pelo usuário — roxo/metálico, tipografia bold
angular, ilustração de família na composição. Visual do site: vitrine, cor
de marca forte (não minimalista). Paleta exata e tipografia ainda a
definir durante a implementação, a partir do logo.

## Convenções

- Idioma: português do Brasil, em código, commits e documentação.
- Sem abstração prematura — é uso pessoal/familiar, não produto para
  terceiros administrarem.
