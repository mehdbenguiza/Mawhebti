import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Initialize EventBus listeners AVANT d'importer le reste
# On importe via des noms différents pour ne pas écraser la variable `app`
import app.services.audit_service as _audit_service
import app.services.notification_service as _notification_service

fastapi_app = FastAPI(
    title="Mawhebti API",
    description="API pour la plateforme Mawhebti",
    version="1.0.0",
)

# Origines autorisées via variable d'environnement (séparées par des virgules)
# En production : ne lister QUE le domaine HTTPS officiel
_raw_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://192.168.182.128:5173,http://192.168.182.128:8000"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.router import api_router

# Monter le dossier uploads pour servir les vidéos et avatars
os.makedirs("uploads", exist_ok=True)
fastapi_app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

fastapi_app.include_router(api_router, prefix="/api/v1")

# Alias pour compatibilité uvicorn (uvicorn app.main:app)
app = fastapi_app

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Mawhebti API is running"}
