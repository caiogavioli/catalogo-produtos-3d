# Catálogo de produtos de impressão 3D

Gera um catálogo em PDF (por categoria e completo) dos produtos impressos em
3D, a partir dos dados extraídos da conta do usuário no MakerWorld.

## Problema

Os modelos ficam organizados em pastas de categoria na conta do MakerWorld,
mas não existe nenhum documento apresentável para mostrar/vender esses
produtos a clientes. Hoje a única vitrine é um Instagram simples.

## Escopo

- Raspagem automática das pastas/categorias do MakerWorld: nome, descrição,
  tamanho e foto(s) de cada produto.
- Base intermediária em planilha/CSV, editável pelo usuário (corte de
  produtos indesejados antes de gerar o PDF).
- Geração de um PDF por categoria e de um PDF completo agrupando tudo.
- Sem preço. Sem loja online. Execução local, sob demanda.

Spec completa da decisão: ver `projetos/catalogo-produtos-3d.md` no
repositório [caiogavioli/Brainstorm](https://github.com/caiogavioli/Brainstorm).

## Estrutura

```
scraper/     # script de raspagem do MakerWorld -> data/catalogo.csv
data/        # planilha/CSV (fonte da verdade) e fotos baixadas
pdf/         # script de geração dos PDFs a partir do CSV
output/      # PDFs gerados (por categoria + completo)
```

## Como rodar

_A documentar conforme os scripts forem implementados._

1. Rodar a raspagem: popula/atualiza `data/catalogo.csv` e `data/fotos/`.
2. Revisar `data/catalogo.csv` — remover produtos que não quer manter.
3. Rodar a geração de PDF: gera os arquivos em `output/`.

## Status

Em construção — esqueleto inicial criado a partir da spec fechada em
`caiogavioli/Brainstorm`.
