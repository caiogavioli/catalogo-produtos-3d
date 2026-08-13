"""Estruturas de dados da raspagem."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Produto:
    categoria: str
    nome: str
    descricao: str
    tamanho: str
    url: str
    fotos: list[str] = field(default_factory=list)
