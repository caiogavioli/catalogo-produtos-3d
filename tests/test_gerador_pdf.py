from pathlib import Path

import pytest
from PIL import Image as PILImage

from pdf import layout
from pdf.gerador import agrupar_por_categoria, gerar
from scraper.modelos import Produto


def _produto(nome="Vaso", categoria="Vasos", **kwargs):
    base = dict(
        categoria=categoria,
        nome=nome,
        descricao="Uma descrição",
        tamanho="120 x 80 x 45 mm",
        url="https://makerworld.com/en/models/1",
        fotos=[],
    )
    base.update(kwargs)
    return Produto(**base)


def _criar_foto(caminho: Path) -> str:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    PILImage.new("RGB", (800, 600), (120, 160, 200)).save(caminho)
    return str(caminho)


def test_agrupar_preserva_ordem_de_aparicao():
    produtos = [
        _produto("A", categoria="Vasos"),
        _produto("B", categoria="Suportes"),
        _produto("C", categoria="Vasos"),
    ]

    grupos = agrupar_por_categoria(produtos)

    assert list(grupos.keys()) == ["Vasos", "Suportes"]
    assert [p.nome for p in grupos["Vasos"]] == ["A", "C"]


def test_gerar_cria_um_pdf_por_categoria_mais_o_completo(tmp_path):
    produtos = [_produto("A", categoria="Vasos"), _produto("B", categoria="Suportes")]

    gerados = gerar(produtos, tmp_path)

    nomes = sorted(p.name for p in gerados)
    assert nomes == ["catalogo-completo.pdf", "catalogo-suportes.pdf", "catalogo-vasos.pdf"]
    for caminho in gerados:
        assert caminho.exists()
        assert caminho.stat().st_size > 500  # PDF real, não arquivo vazio


def test_gerar_com_lista_vazia_da_erro_claro(tmp_path):
    with pytest.raises(ValueError, match="Nenhum produto"):
        gerar([], tmp_path)


def test_gerar_inclui_a_foto_quando_existe(tmp_path, monkeypatch):
    foto = _criar_foto(tmp_path / "data" / "fotos" / "vaso" / "01.jpg")
    monkeypatch.setattr(layout, "RAIZ", tmp_path)
    produto = _produto(fotos=[str(Path(foto).relative_to(tmp_path))])

    sem_foto = gerar([_produto(fotos=[])], tmp_path / "sem")[0].stat().st_size
    com_foto = gerar([produto], tmp_path / "com")[0].stat().st_size

    assert com_foto > sem_foto


def test_foto_inexistente_nao_quebra_a_geracao(tmp_path):
    produto = _produto(fotos=["data/fotos/nao/existe.jpg"])

    gerados = gerar([produto], tmp_path)

    assert gerados[0].exists()


def test_descricao_com_caracteres_xml_nao_quebra(tmp_path):
    # '&' e '<' quebrariam o parser de Paragraph do reportlab se não escapados
    produto = _produto(descricao="Vaso <grande> & resistente", nome="A & B")

    gerados = gerar([produto], tmp_path)

    assert gerados[0].exists()


def test_produto_sem_preco_gera_normalmente(tmp_path):
    gerados = gerar([_produto(preco="")], tmp_path)

    assert gerados[0].exists()
