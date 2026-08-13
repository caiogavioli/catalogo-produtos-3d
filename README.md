# CMG3D — Catálogo de produtos de impressão 3D

Site com catálogo público (vitrine) dos produtos impressos em 3D pela CMG3D,
mais uma área administrativa com login para cadastrar e manter os produtos.

## Problema

Os modelos ficam organizados em pastas de categoria na conta do MakerWorld,
mas não existe nenhuma vitrine apresentável para mostrar/vender esses
produtos a clientes. Hoje a única vitrine é um Instagram simples.

## Escopo

- **Catálogo público**: sem login, navegação por categoria, visual de
  vitrine na identidade CMG3D. Cada produto mostra foto(s), nome,
  descrição, tamanho e preço (preço pode ficar em branco).
- **Área admin**: login para duas pessoas (mesma permissão), cadastro,
  edição e remoção de produtos e categorias.
- **Página de cores disponíveis**: lista geral, independente de produto.
- Sem PDF, sem checkout, sem domínio próprio pago — link gratuito do Vercel.
- Sem raspagem automática do MakerWorld (descartada — ver Status):
  cadastro de produtos é manual, pelo painel admin.

Spec completa da decisão: ver `projetos/catalogo-produtos-3d.md` no
repositório [caiogavioli/Brainstorm](https://github.com/caiogavioli/Brainstorm).

## Stack

- **Frontend**: Next.js (App Router, TypeScript, Tailwind CSS)
- **Hospedagem**: Vercel (domínio gratuito `*.vercel.app`)
- **Banco de dados + Auth + Storage**: Supabase (grátis no volume esperado)

## Estrutura

```
src/app/            # rotas Next.js (catálogo público + /admin)
src/components/      # componentes de UI
src/lib/supabase/    # clientes Supabase (browser, server, middleware)
src/types/           # tipos compartilhados do catálogo
supabase/schema.sql  # schema do banco + políticas de acesso (RLS)
scraper/, data/      # sem uso — raspagem do MakerWorld foi descartada, ver Status
assets/logo/         # logo da marca (a adicionar)
```

## Identidade visual

Marca: **CMG3D**. Logo em roxo/metálico, estilo moderno — ver arquivo em
`assets/logo/` (a adicionar). Visual do site: vitrine, cor de marca forte.
A paleta em `src/app/globals.css` é um placeholder roxo/metálico até o
arquivo do logo chegar.

## Como rodar

### 1. Criar o projeto no Supabase

1. Criar um projeto novo (grátis) em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rodar o conteúdo de `supabase/schema.sql` — cria as
   tabelas, as políticas de acesso e o bucket de storage `produtos`.
3. Em **Authentication → Users**, criar manualmente as duas contas admin
   (e-mail + senha). Não há tela de cadastro pública — só o painel do
   Supabase cria usuários.
4. Em **Project Settings → API**, copiar a `Project URL` e a chave
   `anon public`.

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# preencher NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

- Catálogo público: `http://localhost:3000`
- Painel admin: `http://localhost:3000/admin` (pede login)

### 4. Deploy

Importar o repositório no Vercel, configurar as duas variáveis de ambiente
acima no projeto Vercel, e usar o domínio gratuito `*.vercel.app`.

## Status

Site (catálogo público + área admin) implementado com Next.js + Supabase e
publicado no Vercel. Falta: confirmar que o schema e as contas admin foram
criados no projeto Supabase real, configurar as variáveis de ambiente no
Vercel, adicionar o logo da marca e cadastrar os produtos pelo painel admin.

A raspagem automática do MakerWorld, que estava no escopo original, foi
**descartada**: o ambiente de implementação não tinha acesso de rede ao
MakerWorld para sequer inspecionar a página, e o usuário preferiu cadastro
manual a um raspador não testado contra um site sem API oficial.
