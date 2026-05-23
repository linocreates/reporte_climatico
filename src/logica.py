import requests

def buscar_clima(cidade_usuario):
    """
    Fluxo: busca ID da cidade -> busca clima -> formata resposta.
    """
    # 1. Validação de Entrada (Erro 400)
    if not cidade_usuario or len(cidade_usuario.strip()) < 2:
        return {"erro": True, "codigo": 400, "mensagem": "Nome da cidade inválido."}

    cidade_limpa = cidade_usuario.strip().title()
    url_cidade = f"https://brasilapi.com.br/api/cptec/v1/cidade/{cidade_limpa}"

    try:
        # 2. Busca da Cidade
        res_cidade = requests.get(url_cidade, timeout=10)
        
        if res_cidade.status_code != 200:
            return {"erro": True, "codigo": 503, "mensagem": "Brasil API indisponível."}

        lista_cidades = res_cidade.json()

        # 3. Tratamento de Cidade Não Encontrada (Erro 404)
        if not lista_cidades:
            return {"erro": True, "codigo": 404, "mensagem": "Cidade não encontrada."}

        # Filtra a cidade exata
        cidade_alvo = next((c for c in lista_cidades if c['nome'].title() == cidade_limpa), None)
        
        if not cidade_alvo:
            return {"erro": True, "codigo": 404, "mensagem": "Cidade exata não encontrada."}

        id_cidade = cidade_alvo['id']

        # 4. Busca do Clima
        url_clima = f"https://brasilapi.com.br/api/cptec/v1/clima/previsao/{id_cidade}"
        res_clima = requests.get(url_clima, timeout=10)

        if res_clima.status_code != 200:
            return {"erro": True, "codigo": 503, "mensagem": "Erro ao obter dados climáticos."}

        dados_clima = res_clima.json()

        # 5. Formatação Final 
        return {
            'nome': dados_clima['cidade'],
            'estado': dados_clima['estado'],
            'clima': {
                'temperatura_min': dados_clima['clima'][0]['min'],
                'temperatura_max': dados_clima['clima'][0]['max'],
                'condicao': dados_clima['clima'][0]['condicao_desc'],
                'unidades': {'temperatura': '°C'}
            },
            'consultado_em': dados_clima['clima'][0]['data']
        }

    except Exception as e:
        return {"erro": True, "codigo": 500, "mensagem": f"Erro interno: {str(e)}"}

def listar_cidades_por_estado(sigla_uf):
    """
    Busca a lista de municípios de um estado usando a Brasil API (IBGE).
    """
    uf_limpa = sigla_uf.strip().upper()
    url_municipios = f"https://brasilapi.com.br/api/ibge/municipios/v1/{uf_limpa}"
    
    try:
        resposta = requests.get(url_municipios, timeout=10)
        
        if resposta.status_code in [404, 400]:
            return {"erro": True, "codigo": 404, "mensagem": "Estado não encontrado."}
            
        if resposta.status_code != 200:
            return {"erro": True, "codigo": 503, "mensagem": "Serviço externo indisponível."}
            
        lista_municipios = resposta.json()
        return lista_municipios
        
    except Exception as e:
        return {"erro": True, "codigo": 500, "mensagem": f"Erro interno: {str(e)}"}

if __name__ == "__main__":
    cidade = input("Informe o nome da cidade: ")
    print(buscar_clima(cidade))