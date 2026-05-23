import requests

def buscar_clima(cidade_usuario):
    """
    Fluxo: busca todas as cidades correspondentes -> busca clima de CADA UMA -> retorna lista.
    """
    if not cidade_usuario or len(cidade_usuario.strip()) < 2:
        return {"erro": True, "codigo": 400, "mensagem": "Nome da cidade inválido."}

    cidade_limpa = cidade_usuario.strip().title()
    url_busca = f"https://brasilapi.com.br/api/cptec/v1/cidade/{cidade_limpa}"

    try:
        res_busca = requests.get(url_busca, timeout=10)
        
        if res_busca.status_code != 200:
            return {"erro": True, "codigo": 503, "mensagem": "Brasil API indisponível."}

        lista_cidades = res_busca.json()

        if not lista_cidades:
            return {"erro": True, "codigo": 404, "mensagem": "Cidade não encontrada."}

        previsoes_totais = []

        for cidade_alvo in lista_cidades:
            id_cidade = cidade_alvo['id']
            
            url_clima = f"https://brasilapi.com.br/api/cptec/v1/clima/previsao/{id_cidade}"
            res_clima = requests.get(url_clima, timeout=10)

            if res_clima.status_code != 200:
                continue

            dados_clima = res_clima.json()

            previsao_formatada = {
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
            
            previsoes_totais.append(previsao_formatada)

        if not previsoes_totais:
            return {"erro": True, "codigo": 404, "mensagem": "Nenhum dado climático disponível para as cidades encontradas."}

        return previsoes_totais

    except Exception as e:
        return {"erro": True, "codigo": 500, "mensagem": f"Erro interno: {str(e)}"}

def listar_cidades_por_estado(sigla_uf):
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