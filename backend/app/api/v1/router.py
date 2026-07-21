from fastapi import APIRouter
from app.api.v1.endpoints import auth, profiles, videos, parents, recruitment, conversations, talents

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(videos.router, prefix="/videos", tags=["videos"])
api_router.include_router(parents.router, prefix="/parents", tags=["parents"])
api_router.include_router(recruitment.router, prefix="/recruitment", tags=["recruitment"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(talents.router, prefix="/talents", tags=["talents"])
