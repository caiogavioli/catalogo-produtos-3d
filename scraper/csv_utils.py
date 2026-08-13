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
                    "fotos": ";".join(produto.fotos),
                    "url": produto.url,
                }
            )
