"""Orquestra a raspagem completa: perfil -> coleções -> modelos -> CSV + fotos."""

from __future__ import annotations

import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

from .config import CSV_PATH, FOTOS_DIR, MAX_FOTOS_POR_PRODUTO, RAIZ
from .csv_utils import gravar_csv
from .modelos import Produto
from .navegador import extrair_dados_modelo, listar_colecoes, listar_modelos_da_colecao
from .texto import slugificar


def _baixar_fotos(urls: list[str], destino: Path) -> list[str]:
    destino.mkdir(parents=True, exist_ok=True)
    caminhos: list[str] = []
    for indice, url in enumerate(urls[:MAX_FOTOS_POR_PRODUTO], start=1):
        extensao = Path(url.split("?")[0]).suffix or ".jpg"
        caminho = destino / f"{indice:02d}{extensao}"
        try:
            urllib.request.urlretrieve(url, caminho)
        except OSError as erro:
            print(f"    aviso: falha ao baixar foto {url}: {erro}")
            continue
        # Caminho relativo à raiz do projeto (ex.: "data/fotos/vasos/vaso/01.jpg"),
        # para o gerador de PDF abrir a foto rodando a partir da raiz.
        caminhos.append(str(caminho.relative_to(RAIZ)))
    return caminhos


def raspar(usuario: str, *, headless: bool = True, limite_colecoes: int | None = None) -> list[Produto]:
    produtos: list[Produto] = []

    with sync_playwright() as pw:
        navegador = pw.chromium.launch(headless=headless)
        pagina = navegador.new_page()

        colecoes = listar_colecoes(pagina, usuario)
        if limite_colecoes is not None:
            colecoes = colecoes[:limite_colecoes]

        print(f"{len(colecoes)} coleção(ões) encontrada(s) para @{usuario}")
        if not colecoes:
            print(
                "  nenhuma coleção encontrada — confira se o usuário está certo e se o "
                "perfil tem coleções públicas. Rode com --visivel para depurar."
            )

        for colecao in colecoes:
            urls_modelos = listar_modelos_da_colecao(pagina, colecao)
            print(f"  {colecao.nome}: {len(urls_modelos)} modelo(s)")

            for url_modelo in urls_modelos:
                dados = extrair_dados_modelo(pagina, url_modelo)

                slug_categoria = slugificar(colecao.nome)
                slug_produto = slugificar(dados["nome"])
                destino_fotos = FOTOS_DIR / slug_categoria / slug_produto
                fotos = _baixar_fotos(dados["fotos"], destino_fotos)

                produtos.append(
                    Produto(
                        categoria=colecao.nome,
                        nome=dados["nome"],
                        descricao=dados["descricao"],
                        tamanho=dados["tamanho"],
                        url=dados["url"],
                        fotos=fotos,
                    )
                )

        navegador.close()

    return produtos


def raspar_e_gravar(usuario: str, **kwargs) -> list[Produto]:
    produtos = raspar(usuario, **kwargs)
    gravar_csv(produtos, CSV_PATH)
    print(f"\n{len(produtos)} produto(s) gravados em {CSV_PATH}")
    return produtos
