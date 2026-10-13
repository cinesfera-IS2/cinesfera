from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


TipoContenido = Literal["pelicula", "serie"]


class GeneroContenido(BaseModel):
    id: int
    nombre: str


class ContenidoDetalleRespuesta(BaseModel):
    tmdb_id: int
    tipo: TipoContenido
    titulo: str
    titulo_original: str
    sinopsis: str
    fecha_estreno: date | None
    poster_url: str | None
    portada_url: str | None
    generos: list[GeneroContenido]
    duracion_minutos: int | None
    cantidad_temporadas: int | None
    calificacion_tmdb: float = Field(ge=0, le=10)


class AutorResena(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None


class ResenaContenidoRespuesta(BaseModel):
    id: UUID
    contenido_tmdb_id: int
    resena_padre_id: UUID | None
    plataforma_id: int | None
    calificacion: float
    texto: str
    fecha: datetime
    valoracion: int
    autor: AutorResena


class ResenaCreacion(BaseModel):
    usuario_id: UUID
    texto: str = Field(min_length=1, max_length=5000)
    calificacion: Decimal = Field(ge=0, le=5)
    plataforma_id: int | None = Field(default=None, gt=0)
    resena_padre_id: UUID | None = None


class ResenaCreadaRespuesta(BaseModel):
    mensaje: str
    id: UUID
    usuario_id: UUID
    contenido_tmdb_id: int
    resena_padre_id: UUID | None
    plataforma_id: int | None
    calificacion: float
    texto: str
    fecha: datetime
