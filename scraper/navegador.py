"""Navegação e extração via Playwright.

O MakerWorld é uma SPA (conteúdo montado via JS), por isso usamos um
navegador real em vez de requests puro. Preferimos extrair dados de fontes
estáveis — padrões de URL de rota (/collections/, /models/) e meta tags
OpenGraph — em vez de nomes de classe CSS, porque classes tendem a mudar a
cada redesign visual. Se o MakerWorld mudar a forma como carrega as listas
(por exemplo, trocar scroll infinito por paginação com botão), os pontos a
ajustar são `_rolar_ate_estabilizar` e os seletores usados em
`listar_colecoes` / `listar_modelos_da_colecao` abaixo.
"""

from __future__ import annotations

from dataclasses import dataclass

from playwright.sync_api import Page

from .config import BASE_URL, MAX_SCROLLS, PAUSA_SCROLL_MS, TIMEOUT_NAVEGACAO_MS
from .texto import extrair_tamanho


@dataclass
class Colecao:
    nome: str
    url: str


def _rolar_ate_estabilizar(pagina: Page, seletor_itens: str) -> None:
    """Rola a página até o nº de itens carregados parar de crescer."""
    anterior = -1
    for _ in range(MAX_SCROLLS):
        atual = pagina.eval_on_selector_all(seletor_itens, "els => els.length")
        if atual == anterior:
            break
        anterior = atual
        pagina.mouse.wheel(0, 15000)
        pagina.wait_for_timeout(PAUSA_SCROLL_MS)


def listar_colecoes(pagina: Page, usuario: str) -> list[Colecao]:
    """Lista as coleções públicas do perfil `usuario` — usadas como categorias."""
    url_perfil = f"{BASE_URL}/en/@{usuario}/collections"
    pagina.goto(url_perfil, timeout=TIMEOUT_NAVEGACAO_MS, wait_until="networkidle")
    _rolar_ate_estabilizar(pagina, "a[href*='/collections/']")

    itens = pagina.eval_on_selector_all(
        "a[href*='/collections/']",
        "els => els.map(e => ({href: e.href, texto: e.textContent}))",
    )

    colecoes: dict[str, Colecao] = {}
    for item in itens:
        href = item["href"]
        if href.rstrip("/") == url_perfil.rstrip("/"):
            continue
        nome = (item["texto"] or "").strip()
        if not nome:
            continue
        colecoes.setdefault(href, Colecao(nome=nome, url=href))
    return list(colecoes.values())


def listar_modelos_da_colecao(pagina: Page, colecao: Colecao) -> list[str]:
    """Lista as URLs dos modelos dentro de uma coleção."""
    pagina.goto(colecao.url, timeout=TIMEOUT_NAVEGACAO_MS, wait_until="networkidle")
    _rolar_ate_estabilizar(pagina, "a[href*='/models/']")

    hrefs = pagina.eval_on_selector_all("a[href*='/models/']", "els => els.map(e => e.href)")
    return list(dict.fromkeys(hrefs))  # remove duplicatas preservando ordem


def _meta(pagina: Page, propriedade: str) -> str:
    conteudo = pagina.eval_on_selector(f"meta[property='{propriedade}']", "el => el && el.content")
    return (conteudo or "").strip()


def extrair_dados_modelo(pagina: Page, url_modelo: str) -> dict:
    """Extrai nome, descrição, tamanho e fotos da página de um modelo."""
    pagina.goto(url_modelo, timeout=TIMEOUT_NAVEGACAO_MS, wait_until="networkidle")

    nome = _meta(pagina, "og:title") or pagina.title()
    descricao = _meta(pagina, "og:description")
    imagem_principal = _meta(pagina, "og:image")

    texto_pagina = pagina.inner_text("body")
    tamanho = extrair_tamanho(texto_pagina)

    # Best-effort: pega imagens adicionais da galeria além da capa (og:image).
    # Pode incluir imagens que não são fotos do produto (avatar, ícones) —
    # por isso vale conferir data/catalogo.csv antes de gerar o PDF.
    galeria = pagina.eval_on_selector_all(
        "img[src*='makerworld']", "els => els.map(e => e.src)"
    )
    fotos = [f for f in dict.fromkeys([imagem_principal, *galeria]) if f]

    return {
        "nome": nome,
        "descricao": descricao,
        "tamanho": tamanho,
        "fotos": fotos,
        "url": url_modelo,
    }
