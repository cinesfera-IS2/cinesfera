from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.contenidos import router as contenidos_router
from app.routers.seguimientos import router as seguimientos_router
from app.routers.usuarios import router as usuarios_router
from app.routers.reportes import router as reportes_router
from app.routers.administracion import router as administracion_router
from app.catalogue_service.controllers.CatalogueController import router
from app.database import SessionLocal, get_db
from app.services.bootstrap_admin import crear_administrador_inicial


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Sin credenciales de bootstrap no se abre una conexión solo para comprobar
    # si hay admins. Esto mantiene saludables los tests aislados y los entornos
    # donde la creación inicial ya se deshabilitó quitando las variables.
    if (
        settings.admin_inicial_email
        and settings.admin_inicial_password
        and settings.admin_inicial_usuario
        and get_db not in _app.dependency_overrides
    ):
        with SessionLocal() as db:
            crear_administrador_inicial(db, settings)
    yield


app = FastAPI(
    title="Cinesfera API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origenes_cors,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


app.include_router(auth_router)
app.include_router(contenidos_router)
app.include_router(seguimientos_router)
app.include_router(usuarios_router)
app.include_router(reportes_router)
app.include_router(administracion_router)


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



app.include_router(router)
