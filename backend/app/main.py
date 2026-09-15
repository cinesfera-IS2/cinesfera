from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router


app = FastAPI(
    title="Cinesfera API",
    docs_url="/docs",
    redoc_url="/redoc"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origenes_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Backend funcionando",
        "environment": settings.environment,
        "docs": f"{settings.api_url}/docs"
    }


@app.get("/health", tags=["Infraestructura"])
def health():
    """Chequeo de salud que usa Render para saber si el servicio vive."""
    return {"status": "ok"}
