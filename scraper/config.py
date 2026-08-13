"""Configuração da raspagem: caminhos, colunas do CSV e parâmetros de navegação.

Os parâmetros de scroll/timeout abaixo são os pontos mais prováveis de precisar
ajuste se o MakerWorld mudar seu comportamento de carregamento (ver risco
descrito no CLAUDE.md).
"""

from pathlib import Path

BASE_URL = "https://makerworld.com"

RAIZ = Path(__file__).resolve().parent.parent
DATA_DIR = RAIZ / "data"
FOTOS_DIR = DATA_DIR / "fotos"
CSV_PATH = DATA_DIR / "catalogo.csv"

# `preco` nunca vem da raspagem (o MakerWorld não tem essa informação) — é
# preenchido à mão na planilha. Se ficar vazio, não aparece no PDF.
CSV_COLUNAS = ["categoria", "nome", "descricao", "tamanho", "preco", "fotos", "url"]

TIMEOUT_NAVEGACAO_MS = 20_000

# Nº máximo de "scrolls" ao carregar listagens com scroll infinito, e a pausa
# entre cada um para dar tempo da página carregar mais itens.
MAX_SCROLLS = 30
PAUSA_SCROLL_MS = 800

MAX_FOTOS_POR_PRODUTO = 5
