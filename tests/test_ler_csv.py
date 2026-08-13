from scraper.csv_utils import gravar_csv, ler_csv
from scraper.modelos import Produto


def test_ler_csv_faz_ida_e_volta_com_gravar(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    original = Produto(
        categoria="Vasos",
        nome="Vaso Geométrico",
        descricao="Descrição",
        tamanho="120 x 80 x 45 mm",
        preco="R$ 45,00",
        url="https://makerworld.com/en/models/1",
        fotos=["data/fotos/a.jpg", "data/fotos/b.jpg"],
    )

    gravar_csv([original], caminho)
    lidos = ler_csv(caminho)

    assert lidos == [original]


def test_ler_csv_ignora_linhas_sem_nome(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    caminho.write_text(
        "categoria,nome,descricao,tamanho,preco,fotos,url\n"
        "Vasos,,,,,,\n"
        "Vasos,Vaso,desc,10 x 10 x 10 mm,,,\n",
        encoding="utf-8",
    )

    lidos = ler_csv(caminho)

    assert [p.nome for p in lidos] == ["Vaso"]


def test_ler_csv_sem_categoria_usa_rotulo_padrao(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    caminho.write_text(
        "categoria,nome,descricao,tamanho,preco,fotos,url\n,Vaso,,,,,\n", encoding="utf-8"
    )

    assert ler_csv(caminho)[0].categoria == "Sem categoria"


def test_ler_csv_tolera_colunas_ausentes(tmp_path):
    # planilha montada à mão, só com o essencial
    caminho = tmp_path / "catalogo.csv"
    caminho.write_text("nome,preco\nVaso,R$ 30\n", encoding="utf-8")

    produto = ler_csv(caminho)[0]

    assert produto.nome == "Vaso"
    assert produto.preco == "R$ 30"
    assert produto.fotos == []


def test_ler_csv_aceita_bom_do_excel(tmp_path):
    caminho = tmp_path / "catalogo.csv"
    caminho.write_bytes("nome,preco\nVaso,R$ 30\n".encode("utf-8-sig"))

    assert ler_csv(caminho)[0].nome == "Vaso"
