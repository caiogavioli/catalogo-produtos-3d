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
- **Raspagem do MakerWorld** para popular os produtos inicialmente; edição
  posterior é manual, pelo painel admin.
- Sem PDF, sem checkout, sem domínio próprio pago — link gratuito do Vercel.

Spec completa da decisão: ver `projetos/catalogo-produtos-3d.md` no
repositório [caiogavioli/Brainstorm](https://github.com/caiogavioli/Brainstorm).

## Stack

- **Frontend**: Next.js
- **Hospedagem**: Vercel (domínio gratuito `*.vercel.app`)
- **Banco de dados + Auth + Storage**: Supabase (grátis no volume esperado)
- **Raspagem inicial**: script contra o MakerWorld (sem API pública)

## Estrutura

```
scraper/     # script de raspagem do MakerWorld -> popula o banco (Supabase)
data/        # dados intermediários/exportados da raspagem, se necessário
app/         # aplicação Next.js (catálogo público + painel admin) — a criar
```

## Identidade visual

Marca: **CMG3D**. Logo em roxo/metálico, estilo moderno — ver arquivo em
`assets/logo/` (a adicionar). Visual do site: vitrine, cor de marca forte.

## Como rodar

_A documentar conforme a aplicação for implementada._

## Status

Em construção — esqueleto inicial criado a partir da spec revisada (v2) em
`caiogavioli/Brainstorm`.
