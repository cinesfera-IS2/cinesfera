from datetime import date, datetime
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
    plataforma_id: int | None
    calificacion: float
    texto: str
    fecha: datetime
    valoracion: int
    autor: AutorResena
