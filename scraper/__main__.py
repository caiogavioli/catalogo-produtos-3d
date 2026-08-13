"""CLI: python -m scraper --usuario <handle-no-makerworld>"""

from __future__ import annotations

import argparse

from .raspagem import raspar_e_gravar


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Raspa as coleções e modelos da conta do usuário no MakerWorld e "
            "grava data/catalogo.csv"
        )
    )
    parser.add_argument(
        "--usuario",
        required=True,
        help="handle da conta no MakerWorld (o que aparece depois de @ na URL do perfil)",
    )
    parser.add_argument(
        "--visivel",
        action="store_true",
        help="abre o navegador em modo visível — útil para depurar se o site mudou de layout",
    )
    parser.add_argument(
        "--limite-colecoes",
        type=int,
        default=None,
        help="raspa só as N primeiras coleções, útil para testar rápido",
    )
    args = parser.parse_args()

    raspar_e_gravar(
        args.usuario,
        headless=not args.visivel,
        limite_colecoes=args.limite_colecoes,
    )


if __name__ == "__main__":
    main()
