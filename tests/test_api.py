from unittest.mock import patch
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

CIDADE_VALIDA_MOCK = [
    {
        "nome": "São Paulo",
        "estado": "SP",
        "clima": {
            "temperatura_min": 18,
            "temperatura_max": 28,
            "condicao": "Parcialmente nublado",
            "unidades": {"temperatura": "°C"},
        },
        "consultado_em": "2026-05-31T00:00:00Z",
    }
]


def test_cidade_valida_retorna_dados_climaticos():
    """Teste 1: cidade válida deve retornar status 200 e dados de clima."""
    with patch("src.main.buscar_clima", return_value=CIDADE_VALIDA_MOCK):
        resposta = client.get("/api/v1/clima/São Paulo")

    assert resposta.status_code == 200
    dados = resposta.json()
    assert isinstance(dados, list)
    assert len(dados) > 0
    assert dados[0]["nome"] == "São Paulo"
    assert "clima" in dados[0]


def test_cidade_nao_encontrada_retorna_404():
    """Teste 2: cidade inexistente deve retornar status 404 e mensagem de erro."""
    with patch(
        "src.main.buscar_clima",
        return_value={"erro": True, "codigo": 404, "mensagem": "Cidade não encontrada."},
    ):
        resposta = client.get("/api/v1/clima/CidadeQueNaoExiste")

    assert resposta.status_code == 404
    dados = resposta.json()
    assert dados["erro"] is True
    assert dados["codigo"] == "CIDADE_NAO_ENCONTRADA"