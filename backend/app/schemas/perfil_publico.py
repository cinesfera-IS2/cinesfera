from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ResenaPublica(BaseModel):
    id: UUID
    contenido_tmdb_id: int
    plataforma_id: int | None
    calificacion: float
    texto: str
    fecha: datetime


class PerfilPublicoRespuesta(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None
    reputacion: int
    resenas: list[ResenaPublica]
