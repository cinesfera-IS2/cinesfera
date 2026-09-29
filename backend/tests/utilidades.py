"""Piezas compartidas por los tests que usan una base de datos en memoria.

En lugar de conectarse a Supabase, cada test arma una base SQLite vacía que
vive solo en la memoria mientras corre y desaparece al terminar. Así los tests
nunca tocan datos reales y cada uno arranca de cero.
"""

from datetime import datetime, timezone
from unittest import TestCase
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import MetaData, create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core import security
from app.core.enums import EstadoUsuario, RolUsuario
from app.database import get_db
from app.main import app
from app.models.usuario import Usuario


PASSWORD_DE_PRUEBA = "ClaveSegura123"


def crear_base_en_memoria(test: TestCase, *modelos) -> Session:
    """Crea las tablas de `modelos` en una base SQLite nueva y devuelve una sesión."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        execution_options={"schema_translate_map": {"public": None}}
    )
    test.addCleanup(engine.dispose)

    # Los valores por defecto del modelo son funciones de PostgreSQL
    # (gen_random_uuid, now) que SQLite no conoce: se crean las tablas sin
    # ellos y se completan desde Python antes de cada INSERT.
    metadata = MetaData()
    for modelo in modelos:
        tabla = modelo.__table__.to_metadata(metadata, schema=None)
        for columna in tabla.columns:
            columna.server_default = None
    metadata.create_all(engine)

    event.listen(Usuario, "before_insert", _completar_valores_por_defecto)
    test.addCleanup(
        event.remove, Usuario, "before_insert", _completar_valores_por_defecto
    )

    db = Session(engine)
    test.addCleanup(db.close)
    return db


def _completar_valores_por_defecto(_mapper, _conexion, usuario: Usuario):
    if usuario.id is None:
        usuario.id = uuid4()
    if usuario.fecha_registro is None:
        usuario.fecha_registro = datetime.now(timezone.utc)


def conectar_api(test: TestCase, db: Session) -> TestClient:
    """Devuelve un cliente HTTP de la API que usa `db` en lugar de Supabase."""
    def db_pruebas():
        yield db

    anteriores = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = db_pruebas
    test.addCleanup(_restaurar_dependencias, anteriores)

    client = TestClient(app)
    test.addCleanup(client.close)
    return client


def _restaurar_dependencias(anteriores):
    app.dependency_overrides.clear()
    app.dependency_overrides.update(anteriores)


def configurar_jwt(test: TestCase) -> str:
    """Fija una clave JWT de prueba para no depender del `.env` y la devuelve."""
    secret = "clave-de-pruebas-aisladas-de-al-menos-32-caracteres"
    configuracion = patch.multiple(
        security, JWT_SECRET_KEY=secret, JWT_ALGORITHM="HS256",
        JWT_EXPIRE_MINUTES=30
    )
    configuracion.start()
    test.addCleanup(configuracion.stop)
    return secret


def crear_usuario(
    db: Session,
    nombre_usuario: str,
    *,
    password_hash: str = "hash-de-prueba",
    **campos
) -> Usuario:
    """Guarda un usuario con datos inventados; `campos` pisa cualquiera de ellos."""
    datos = {
        "id": uuid4(),
        "nombre": "Persona",
        "apellido": "Prueba",
        "nombre_usuario": nombre_usuario,
        "email": f"{nombre_usuario}@example.com",
        "password_hash": password_hash,
        "foto_url": None,
        "rol": RolUsuario.USUARIO,
        "estado": EstadoUsuario.ACTIVO,
        "fecha_registro": datetime.now(timezone.utc),
        **campos
    }
    usuario = Usuario(**datos)
    db.add(usuario)
    db.commit()
    return usuario
