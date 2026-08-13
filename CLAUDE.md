# CLAUDE.md

Contexto para qualquer sessão do Claude trabalhando neste repositório.

## O que é este projeto

Ferramenta local (sem servidor, sem custo mensal) que gera um catálogo em
PDF dos produtos de impressão 3D do usuário, a partir dos dados da conta
dele no MakerWorld. Mantido e rodado só pelo próprio usuário, sob demanda.

Spec de origem (decisão completa, trade-offs, riscos): repositório
[caiogavioli/Brainstorm](https://github.com/caiogavioli/Brainstorm),
arquivo `projetos/catalogo-produtos-3d.md`.

## Escopo da v1

Entra:
- Raspagem automática das pastas/categorias da conta do usuário no
  MakerWorld: nome, descrição, tamanho e foto(s) de cada produto.
- Gravação numa planilha/CSV intermediária (fonte da verdade), editável
  manualmente pelo usuário antes da geração do PDF.
- Geração de um PDF por categoria e de um PDF completo agrupando tudo.
- Layout simples: foto(s), descrição, tamanho e preço.

Preço não constava da spec original ("sem preço"); foi incluído depois,
a pedido do usuário, como coluna opcional da planilha — preenchida à mão
(nunca vem da raspagem) e omitida do PDF quando vazia.

Não entra:
- Loja online, checkout.
- Integração com Instagram ou outras redes.
- Atualização automática/agendada — sempre rodado manualmente pelo usuário.

## Stack

- Raspagem: Python + Playwright (o MakerWorld é uma SPA e não tem API
  pública).
- Base de dados: planilha/CSV simples (`data/catalogo.csv`), preenchível
  pela raspagem ou à mão — o gerador de PDF só depende do CSV.
- Geração de PDF: Python + reportlab (escolhido em vez do weasyprint por
  instalar com pip puro, sem dependências de sistema como cairo/pango).
- Execução: local, sob demanda, sem backend, sem hospedagem.

## Riscos conhecidos

- MakerWorld não tem API pública: a raspagem depende da estrutura atual da
  página e pode quebrar se o site mudar o layout. Manutenção ocasional do
  script é esperada.
- Validar que a extração é dos dados da própria conta do usuário (uso
  pessoal), respeitando os termos de uso do MakerWorld.

## Convenções

- Idioma: português do Brasil, em código, commits e documentação.
- Sem abstração prematura — é uma ferramenta de uso pessoal, não um
  produto para terceiros.
