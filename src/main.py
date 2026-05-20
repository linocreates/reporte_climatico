import requests
from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="API de Agregação de Dados Climáticos e Geográficos")

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