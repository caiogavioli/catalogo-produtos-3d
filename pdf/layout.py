"""Monta os blocos visuais (flowables) de cada produto."""

from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Image, KeepTogether, Paragraph, Spacer, Table, TableStyle

from scraper.modelos import Produto

from .config import (
    ESPACO_ENTRE_PRODUTOS,
    FOTO_ALTURA,
    FOTO_LARGURA,
    MAX_MINIATURAS,
    MINIATURA_LADO,
    RAIZ,
)

_base = getSampleStyleSheet()

ESTILO_TITULO = ParagraphStyle(
    "TituloCatalogo", parent=_base["Title"], fontSize=24, spaceAfter=6
)
ESTILO_CATEGORIA = ParagraphStyle(
    "Categoria", parent=_base["Heading1"], fontSize=16, spaceBefore=4, spaceAfter=8
)
ESTILO_NOME = ParagraphStyle(
    "NomeProduto", parent=_base["Heading2"], fontSize=12, spaceAfter=3
)
ESTILO_CAMPO = ParagraphStyle("Campo", parent=_base["Normal"], fontSize=9, spaceAfter=2)
ESTILO_DESCRICAO = ParagraphStyle(
    "Descricao", parent=_base["Normal"], fontSize=9, leading=12, spaceBefore=3
)


def _resolver(caminho_foto: str) -> Path:
    """Resolve o caminho da foto do CSV — relativo à raiz do projeto."""
    caminho = Path(caminho_foto)
    return caminho if caminho.is_absolute() else RAIZ / caminho


def _imagem(caminho_foto: str, largura_max: float, altura_max: float) -> Image | None:
    """Cria uma imagem escalada para caber na caixa, preservando a proporção.

    Retorna None (com aviso) se o arquivo sumiu ou não é uma imagem válida —
    o catálogo continua sendo gerado sem aquela foto, em vez de quebrar tudo
    por causa de uma linha ruim da planilha.
    """
    caminho = _resolver(caminho_foto)
    try:
        with PILImage.open(caminho) as img:
            largura, altura = img.size
    except (OSError, ValueError) as erro:
        print(f"  aviso: foto ignorada ({caminho_foto}): {erro}")
        return None

    if largura <= 0 or altura <= 0:
        return None

    escala = min(largura_max / largura, altura_max / altura)
    return Image(str(caminho), width=largura * escala, height=altura * escala)


def _coluna_fotos(produto: Produto):
    """Foto principal e, abaixo, miniaturas das fotos adicionais."""
    principal = None
    restantes: list[str] = []

    for caminho in produto.fotos:
        imagem = _imagem(caminho, FOTO_LARGURA, FOTO_ALTURA)
        if imagem is not None:
            principal = imagem
            restantes = produto.fotos[produto.fotos.index(caminho) + 1 :]
            break

    if principal is None:
        return Paragraph("<i>(sem foto)</i>", ESTILO_CAMPO)

    miniaturas = [
        m
        for m in (
            _imagem(c, MINIATURA_LADO, MINIATURA_LADO) for c in restantes[:MAX_MINIATURAS]
        )
        if m is not None
    ]
    if not miniaturas:
        return principal

    tabela_min = Table([miniaturas], hAlign="LEFT")
    tabela_min.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return Table([[principal], [tabela_min]], hAlign="LEFT")


def _coluna_texto(produto: Produto):
    partes = [Paragraph(escape(produto.nome), ESTILO_NOME)]

    if produto.tamanho:
        partes.append(Paragraph(f"<b>Tamanho:</b> {escape(produto.tamanho)}", ESTILO_CAMPO))
    if produto.preco:
        partes.append(Paragraph(f"<b>Preço:</b> {escape(produto.preco)}", ESTILO_CAMPO))
    if produto.descricao:
        partes.append(Paragraph(escape(produto.descricao), ESTILO_DESCRICAO))

    return partes


def bloco_produto(produto: Produto, largura_util: float):
    """Card de um produto: fotos à esquerda, textos à direita."""
    largura_fotos = FOTO_LARGURA + 4
    tabela = Table(
        [[_coluna_fotos(produto), _coluna_texto(produto)]],
        colWidths=[largura_fotos, largura_util - largura_fotos],
    )
    tabela.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#DDDDDD")),
            ]
        )
    )
    # KeepTogether evita que o card do produto seja partido entre duas páginas.
    return KeepTogether([tabela, Spacer(1, ESPACO_ENTRE_PRODUTOS)])
