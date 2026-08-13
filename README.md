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

### Raspagem (MakerWorld -> `data/catalogo.csv`)

O MakerWorld não tem "pastas" nativas na conta do usuário — a organização
mais próxima disso são as **Collections** públicas do perfil, que o
scraper trata como categoria de cada produto.

1. Instalar dependências (recomendado usar um virtualenv):
   ```
   pip install -r requirements.txt
   python -m playwright install chromium
   ```
2. Rodar a raspagem, usando o handle da conta (o que aparece depois do
   `@` na URL do perfil, ex.: `makerworld.com/en/@meuusuario`):
   ```
   python -m scraper --usuario meuusuario
   ```
   Isso popula/sobrescreve `data/catalogo.csv` e baixa as fotos em
   `data/fotos/<categoria>/<produto>/`.

   Flags úteis:
   - `--visivel`: abre o navegador em modo visível, para depurar caso o
     site tenha mudado de layout (ver "Riscos conhecidos" no
     `CLAUDE.md`).
   - `--limite-colecoes N`: raspa só as N primeiras coleções, para testar
     rápido antes de rodar tudo.
3. Revisar `data/catalogo.csv` — a raspagem é best-effort (em especial o
   campo `tamanho` e as fotos extras além da capa), então vale conferir
   antes de gerar o PDF, e remover produtos que não quer manter.
4. Rodar a geração de PDF: gera os arquivos em `output/`.

### Testes

```
pip install -r requirements-dev.txt
pytest
```

## Status

Scraper do MakerWorld implementado (`scraper/`). Geração de PDF ainda não
implementada (`pdf/`).
