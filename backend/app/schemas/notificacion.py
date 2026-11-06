from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class ActorNotificacionRespuesta(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None


class NotificacionRespuesta(BaseModel):
    id: UUID
    tipo: Literal["nuevo_seguidor"]
    leida: bool
    fecha: datetime
    actor: ActorNotificacionRespuesta


class BandejaNotificacionesRespuesta(BaseModel):
    items: list[NotificacionRespuesta]
    no_leidas: int
