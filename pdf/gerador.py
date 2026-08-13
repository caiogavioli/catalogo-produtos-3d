"""Gera um PDF por categoria e um PDF completo com tudo."""

from __future__ import annotations

from collections import OrderedDict
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer

from scraper.modelos import Produto
from scraper.texto import slugificar

from .config import MARGEM, OUTPUT_DIR, TAMANHO_PAGINA, TITULO_CATALOGO
from .layout import ESTILO_CATEGORIA, ESTILO_TITULO, bloco_produto


def agrupar_por_categoria(produtos: list[Produto]) -> "OrderedDict[str, list[Produto]]":
    """Agrupa preservando a ordem em que as categorias aparecem na planilha."""
    grupos: OrderedDict[str, list[Produto]] = OrderedDict()
    for produto in produtos:
        grupos.setdefault(produto.categoria, []).append(produto)
    return grupos


def _rodape(canvas, documento):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(
        TAMANHO_PAGINA[0] - MARGEM, MARGEM / 2, f"{documento.page}"
    )
    canvas.restoreState()


def _montar(caminho: Path, titulo: str, elementos: list) -> Path:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    documento = SimpleDocTemplate(
        str(caminho),
        pagesize=TAMANHO_PAGINA,
        leftMargin=MARGEM,
        rightMargin=MARGEM,
        topMargin=MARGEM,
        bottomMargin=MARGEM,
        title=titulo,
    )
    documento.build(elementos, onFirstPage=_rodape, onLaterPages=_rodape)
    return caminho


def _largura_util() -> float:
    return TAMANHO_PAGINA[0] - 2 * MARGEM


def gerar_pdf_categoria(categoria: str, produtos: list[Produto], destino: Path) -> Path:
    largura = _largura_util()
    elementos = [
        Paragraph(escape(categoria), ESTILO_TITULO),
        Spacer(1, 6 * mm),
    ]
    elementos.extend(bloco_produto(p, largura) for p in produtos)

    caminho = destino / f"catalogo-{slugificar(categoria)}.pdf"
    return _montar(caminho, f"{TITULO_CATALOGO} — {categoria}", elementos)


def gerar_pdf_completo(grupos: "OrderedDict[str, list[Produto]]", destino: Path) -> Path:
    largura = _largura_util()
    elementos = [Paragraph(escape(TITULO_CATALOGO), ESTILO_TITULO), Spacer(1, 8 * mm)]

    for indice, (categoria, produtos) in enumerate(grupos.items()):
        if indice > 0:
            elementos.append(PageBreak())
        elementos.append(Paragraph(escape(categoria), ESTILO_CATEGORIA))
        elementos.extend(bloco_produto(p, largura) for p in produtos)

    caminho = destino / "catalogo-completo.pdf"
    return _montar(caminho, TITULO_CATALOGO, elementos)


def gerar(produtos: list[Produto], destino: Path = OUTPUT_DIR) -> list[Path]:
    """Gera um PDF por categoria e o PDF completo. Retorna os caminhos gerados."""
    if not produtos:
        raise ValueError(
            "Nenhum produto na planilha. Rode a raspagem ou preencha "
            "data/catalogo.csv antes de gerar o PDF."
        )

    grupos = agrupar_por_categoria(produtos)
    gerados = [
        gerar_pdf_categoria(categoria, lista, destino)
        for categoria, lista in grupos.items()
    ]
    gerados.append(gerar_pdf_completo(grupos, destino))
    return gerados
