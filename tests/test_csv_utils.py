import csv

from scraper.csv_utils import gravar_csv
from scraper.modelos import Produto


def test_gravar_csv_escreve_cabecalho_e_linhas(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    produtos = [
        Produto(
            categoria="Vasos",
            nome="Vaso Geométrico",
            descricao="Um vaso geométrico pequeno",
            tamanho="120 x 80 x 45 mm",
            url="https://makerworld.com/en/models/123-vaso",
            fotos=["data/fotos/vasos/vaso-geometrico/01.jpg"],
        )
    ]

    gravar_csv(produtos, caminho)

    with caminho.open(encoding="utf-8") as arquivo:
        linhas = list(csv.DictReader(arquivo))

    assert len(linhas) == 1
    assert linhas[0]["categoria"] == "Vasos"
    assert linhas[0]["nome"] == "Vaso Geométrico"
    assert linhas[0]["fotos"] == "data/fotos/vasos/vaso-geometrico/01.jpg"


def test_gravar_csv_sobrescreve_arquivo_existente(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    caminho.write_text("lixo antigo", encoding="utf-8")

    gravar_csv([], caminho)

    conteudo = caminho.read_text(encoding="utf-8")
    assert "lixo antigo" not in conteudo
    assert "categoria" in conteudo  # cabeçalho


def test_gravar_csv_junta_multiplas_fotos_com_ponto_e_virgula(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    produtos = [
        Produto(
            categoria="Vasos",
            nome="Vaso",
            descricao="",
            tamanho="",
            url="https://makerworld.com/en/models/1-vaso",
            fotos=["a.jpg", "b.jpg"],
        )
    ]

    gravar_csv(produtos, caminho)

    with caminho.open(encoding="utf-8") as arquivo:
        linha = next(csv.DictReader(arquivo))

    assert linha["fotos"] == "a.jpg;b.jpg"
