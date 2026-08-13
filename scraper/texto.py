"""Funções puras de texto usadas na raspagem (sem dependência de rede)."""

from __future__ import annotations

import re
import unicodedata

_PADRAO_TAMANHO = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*mm",
    re.IGNORECASE,
)


def slugificar(texto: str) -> str:
    """Converte um texto livre num slug seguro para nome de arquivo/pasta."""
    texto = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    texto = texto.lower().strip()
    texto = re.sub(r"[^a-z0-9]+", "-", texto)
    return texto.strip("-") or "sem-nome"


def extrair_tamanho(texto: str) -> str:
    """Procura um padrão tipo "120 x 80 x 45 mm" em um bloco de texto da página.

    Retorna string vazia se não encontrar — o campo fica em branco no CSV
    para o usuário preencher manualmente.
    """
    if not texto:
        return ""
    encontrado = _PADRAO_TAMANHO.search(texto)
    if not encontrado:
        return ""
    a, b, c = encontrado.groups()
    return f"{a} x {b} x {c} mm"
