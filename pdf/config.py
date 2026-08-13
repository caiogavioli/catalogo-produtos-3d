"""Constantes de layout do catálogo.

Ajustar aqui é a forma mais simples de mudar a aparência do PDF sem mexer
na lógica de montagem.
"""

from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

RAIZ = Path(__file__).resolve().parent.parent
OUTPUT_DIR = RAIZ / "output"

TAMANHO_PAGINA = A4
MARGEM = 18 * mm

# Caixa reservada para a foto principal de cada produto.
FOTO_LARGURA = 55 * mm
FOTO_ALTURA = 55 * mm

# Miniaturas das fotos adicionais, mostradas abaixo da principal.
MINIATURA_LADO = 16 * mm
MAX_MINIATURAS = 3

ESPACO_ENTRE_PRODUTOS = 8 * mm

TITULO_CATALOGO = "Catálogo de produtos"
