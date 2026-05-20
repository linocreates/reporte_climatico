from fastapi import FastAPI
from datetime import datetime, timezone

app = FastAPI(title="API de Agregação de Dados Climáticos e Geográficos")

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "versao": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }