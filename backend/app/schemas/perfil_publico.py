from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.enums import RolUsuario


class ResenaPublica(BaseModel):
    id: UUID
    contenido_tmdb_id: int
    contenido_tipo: str
    contenido_titulo: str | None
    plataforma_id: int | None
    calificacion: float | None
    texto: str
    fecha: datetime


class PerfilPublicoRespuesta(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None
    bio: str | None
    ubicacion: str | None
    generos_favoritos: list[str]
    rol: RolUsuario
    fecha_registro: datetime
    reputacion: int
    seguidores: int
    siguiendo: int
    resenas: list[ResenaPublica]
