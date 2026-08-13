"""Leitura/escrita de data/catalogo.csv — a fonte da verdade editável pelo usuário."""

from __future__ import annotations

import csv
from pathlib import Path

from .config import CSV_COLUNAS
from .modelos import Produto


def gravar_csv(produtos: list[Produto], caminho: Path) -> None:
    """Grava a lista de produtos em `caminho`, sobrescrevendo o arquivo existente.

    A raspagem é sempre um "retrato" completo da conta no momento em que roda:
    rodar de novo sobrescreve o CSV. Edições manuais devem ser feitas depois
    da raspagem, antes de gerar o PDF.
    """
    caminho.parent.mkdir(parents=True, exist_ok=True)
    with caminho.open("w", newline="", encoding="utf-8") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=CSV_COLUNAS)
        escritor.writeheader()
        for produto in produtos:
            escritor.writerow(
                {
                    "categoria": produto.categoria,
                    "nome": produto.nome,
                    "descricao": produto.descricao,
                    "tamanho": produto.tamanho,
                    "preco": produto.preco,
                    "fotos": ";".join(produto.fotos),
                    "url": produto.url,
                }
            )


def ler_csv(caminho: Path) -> list[Produto]:
    """Lê o CSV editado pelo usuário de volta para uma lista de produtos.

    Tolerante de propósito: a planilha é editada à mão (e pode passar por
    Excel/Google Sheets), então colunas ausentes viram string vazia em vez
    de quebrar. Linhas sem nome são ignoradas — normalmente são sobras de
    edição na planilha.
    """
    with caminho.open(newline="", encoding="utf-8-sig") as arquivo:
        linhas = list(csv.DictReader(arquivo))

    produtos: list[Produto] = []
    for linha in linhas:
        nome = (linha.get("nome") or "").strip()
        if not nome:
            continue
        fotos = [f.strip() for f in (linha.get("fotos") or "").split(";") if f.strip()]
        produtos.append(
            Produto(
                categoria=(linha.get("categoria") or "").strip() or "Sem categoria",
                nome=nome,
                descricao=(linha.get("descricao") or "").strip(),
                tamanho=(linha.get("tamanho") or "").strip(),
                preco=(linha.get("preco") or "").strip(),
                url=(linha.get("url") or "").strip(),
                fotos=fotos,
            )
        )
    return produtos
