"""FastAPI application factory for TechSpace backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routes.profiles import router as profiles_router
from .routes.threads import router as threads_router
from .routes.comments import router as comments_router
from .routes.moderation import router as moderation_router

load_dotenv()

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]


def create_app() -> FastAPI:
    app = FastAPI(title="TechSpace API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    app.include_router(profiles_router)
    app.include_router(threads_router)
    app.include_router(comments_router)
    app.include_router(moderation_router)
    return app


app = create_app()

__all__ = ["create_app", "app"]
