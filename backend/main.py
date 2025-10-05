"""FastAPI application factory for TechSpace backend."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from pathlib import Path

from .routes.profiles import router as profiles_router
from .routes.threads import router as threads_router
from .routes.comments import router as comments_router
from .routes.moderation import router as moderation_router
from .routes.auth import router as auth_router

# Load default .env (current working dir). If required keys absent, also try backend/.env path.
load_dotenv()
if not os.getenv("FIREBASE_PROJECT_ID"):
    backend_env = Path(__file__).resolve().parent / ".env"
    if backend_env.exists():
        load_dotenv(dotenv_path=backend_env, override=False)

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS").split(",")
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

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):  # noqa: D401
        # Let HTTPException pass through unchanged (FastAPI default) so we can wrap manually in routes
        from fastapi import HTTPException

        if isinstance(exc, HTTPException):
            # If detail already structured keep it, else wrap
            detail = exc.detail
            if not isinstance(detail, dict) or "code" not in detail:
                detail = {"code": exc.status_code, "message": str(detail)}
            return JSONResponse(status_code=exc.status_code, content={"error": detail})
        # Fallback 500
        return JSONResponse(status_code=500, content={"error": {"code": 500, "message": "Internal Server Error"}})

    app.include_router(auth_router)
    app.include_router(profiles_router)
    app.include_router(threads_router)
    app.include_router(comments_router)
    app.include_router(moderation_router)

    # Optionally serve built frontend (vite build output) if it exists so frontend + backend share port.
    dist_dir = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    index_file = dist_dir / "index.html"
    if dist_dir.exists() and index_file.exists():
        app.mount("/", StaticFiles(directory=dist_dir, html=True), name="frontend")

        # Explicit SPA fallback (helps when using routers; StaticFiles handles most cases with html=True)
        @app.exception_handler(404)
        async def spa_fallback(request: Request, exc):  # type: ignore[override]
            # If path has a dot, probably an asset -> return original 404
            if "." in request.url.path.split("/")[-1]:
                return JSONResponse(status_code=404, content={"error": {"code": 404, "message": "Not Found"}})
            if index_file.exists():
                return FileResponse(index_file)
            return JSONResponse(status_code=404, content={"error": {"code": 404, "message": "Not Found"}})
    return app


app = create_app()

__all__ = ["create_app", "app"]
