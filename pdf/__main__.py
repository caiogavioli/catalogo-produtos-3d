"""CLI: python -m pdf"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from scraper.config import CSV_PATH
from scraper.csv_utils import ler_csv

from .config import OUTPUT_DIR
from .gerador import gerar


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gera o catálogo em PDF (um por categoria + um completo) a partir do CSV"
    )
    parser.add_argument(
        "--csv", type=Path, default=CSV_PATH, help=f"planilha de entrada (padrão: {CSV_PATH})"
    )
    parser.add_argument(
        "--saida", type=Path, default=OUTPUT_DIR, help=f"pasta de saída (padrão: {OUTPUT_DIR})"
    )
    args = parser.parse_args()

    if not args.csv.exists():
        sys.exit(
            f"planilha não encontrada: {args.csv}\n"
            "Rode a raspagem (python -m scraper --usuario SEU_HANDLE) ou "
            "crie a planilha à mão antes de gerar o PDF."
        )

    produtos = ler_csv(args.csv)
    gerados = gerar(produtos, args.saida)

    print(f"{len(produtos)} produto(s) lidos de {args.csv}")
    for caminho in gerados:
        print(f"  gerado: {caminho}")


if __name__ == "__main__":
    main()
