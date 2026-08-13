from scraper.texto import extrair_tamanho, slugificar


def test_slugificar_remove_acentos_e_espacos():
    assert slugificar("Vaso Geométrico Pequeno") == "vaso-geometrico-pequeno"


def test_slugificar_string_vazia():
    assert slugificar("") == "sem-nome"


def test_slugificar_remove_caracteres_especiais():
    assert slugificar("Suporte p/ Fone (v2)!!") == "suporte-p-fone-v2"


def test_extrair_tamanho_encontra_padrao_com_x_minusculo():
    texto = "Descrição do produto. Tamanho: 120 x 80 x 45 mm. Peso: 30g"
    assert extrair_tamanho(texto) == "120 x 80 x 45 mm"


def test_extrair_tamanho_aceita_multiplicacao_unicode():
    texto = "Dimensões 12.5×8×4.2mm aproximadamente"
    assert extrair_tamanho(texto) == "12.5 x 8 x 4.2 mm"


def test_extrair_tamanho_retorna_vazio_se_nao_encontrar():
    assert extrair_tamanho("Sem informação de tamanho aqui") == ""


def test_extrair_tamanho_texto_vazio():
    assert extrair_tamanho("") == ""
