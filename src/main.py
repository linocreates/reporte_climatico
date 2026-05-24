from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import requests
from datetime import datetime, timezone
from src.logica import buscar_clima, listar_cidades_por_estado

app = FastAPI(title="API de Agregação de Dados Climáticos e Geográficos")

# ENDPOINT 3
@app.get("/api/v1/health")
async def health_check():
    current_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    
    try:
        request_response = requests.get("https://brasilapi.com.br/api/cptec/v1/cidade", timeout=5)
        
        if request_response.status_code == 200:
            return {
                "status": "healthy",
                "versao": "1.0.0",
                "timestamp": current_timestamp
            }
        else:
            return {
                "status": "degraded",
                "versao": "1.0.0",
                "timestamp": current_timestamp,
                "motivo": "Serviço externo indisponível"
            }
        
    except Exception:
        return {
            "status": "degraded",
            "versao": "1.0.0",
            "timestamp": current_timestamp,
            "motivo": "Serviço externo indisponível"
        }
    
# ENDPOINT 1
@app.get("/api/v1/clima/{nome_cidade}")
async def obter_clima(nome_cidade: str):
    if len(nome_cidade.strip()) < 2:
        return JSONResponse(
            status_code=400,
            content={
                "erro": True,
                "codigo": "NOME_INVALIDO",
                "mensagem": "O nome da cidade deve conter pelo menos 2 caracteres",
                "nome_informado": nome_cidade
            }
        )    
    
    try:
        result = buscar_clima(nome_cidade)
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "erro": True,
                "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
                "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
                "servico": "CPTEC"
            }
        )
    
    if isinstance(result, dict) and "erro" in result:
        codigo_erro = result.get("codigo")
        mensagem_erro = str(result.get("mensagem")).lower()
        
        if (codigo_erro == 503) or ("failed to resolve" in mensagem_erro):
            return JSONResponse(
                status_code=503,
                content={
                    "erro": True,
                    "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
                    "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
                    "servico": "CPTEC"
                }
            )
        
        return JSONResponse(
            status_code=404,
            content={
                "erro": True,
                "codigo": "CIDADE_NAO_ENCONTRADA",
                "mensagem": "Nenhuma cidade encontrada com o nome informado",
                "nome_informado": nome_cidade
            }
        )
        
    if not result:
        return JSONResponse(
            status_code=404,
            content={
                "erro": True,
                "codigo": "CIDADE_NAO_ENCONTRADA",
                "mensagem": "Nenhuma cidade encontrada com o nome informado",
                "nome_informado": nome_cidade
            }
        )
    
    if isinstance(result, list):
        full_timestamp = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        for previsao in result:
            previsao["consultado_em"] = full_timestamp

    return result

# ENDPOINT 2
@app.get("/api/v1/cidades/{sigla_uf}")
async def obter_cidades_por_estado(sigla_uf: str, limite: int = 10):
    uf_limpa = sigla_uf.strip().upper()
    if len(uf_limpa) != 2 or not uf_limpa.isalpha():
        return JSONResponse(
            status_code=400,
            content={
                "erro": True,
                "codigo": "SIGLA_UF_INVALIDA",
                "mensagem": "A sigla do estado deve conter exatamente 2 letras",
                "sigla_uf_informada": sigla_uf
            }
        )

    try:
        result = listar_cidades_por_estado(uf_limpa)
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "erro": True,
                "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
                "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
                "servico": "IBGE"
            }
        )

    if isinstance(result, dict) and "erro" in result:
        codigo_erro = result.get("codigo")
        
        if codigo_erro in [500, 503]:
            return JSONResponse(
                status_code=503,
                content={
                    "erro": True,
                    "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
                    "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
                    "servico": "IBGE"
                }
            )
        
        return JSONResponse(
            status_code=404,
            content={
                "erro": True,
                "codigo": "UF_NAO_ENCONTRADA",
                "mensagem": "Estado com a sigla informada não foi encontrado",
                "sigla_uf_informada": sigla_uf
            }
        )

    if not isinstance(result, list):
        return JSONResponse(
            status_code=404,
            content={
                "erro": True,
                "codigo": "UF_NAO_ENCONTRADA",
                "mensagem": "Estado com a sigla informada não foi encontrado",
                "sigla_uf_informada": sigla_uf
            }
        )

    lista_formatada = [{"nome": city["nome"].title()} for city in result]
    lista_com_limite = lista_formatada[:limite]
    timestamp_sucesso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    return {
        "uf": uf_limpa,
        "quantidade_retornada": len(lista_com_limite),
        "cidades": lista_com_limite,
        "consultado_em": timestamp_sucesso
    }