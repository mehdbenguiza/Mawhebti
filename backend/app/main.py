import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Mawhebti API",
    description="API pour la plateforme Mawhebti",
    version="1.0.0",
)

# Origines autorisées via variable d'environnement (séparées par des virgules)
# En production : ne lister QUE le domaine HTTPS officiel
_raw_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

from app.api.v1.router import api_router
from fastapi.staticfiles import StaticFiles

# Initialize EventBus listeners
import app.services.audit_service
import app.services.notification_service

# Monter le dossier uploads pour servir les vidéos et avatars
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Mawhebti API is running"}
