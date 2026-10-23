from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SeguimientoRespuesta(BaseModel):
    seguidor_id: UUID
    seguido_id: UUID
    fecha_seguimiento: datetime
    son_amigos: bool


class EstadoSeguimientoRespuesta(BaseModel):
    siguiendo: bool
    te_sigue: bool
    son_amigos: bool


class UsuarioSeguimientoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None
