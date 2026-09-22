from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.core.enums import EstadoAmistad


class SolicitudAmistadCreacion(BaseModel):
    destinatario_id: UUID


class SolicitudAmistadRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    usuario_id_1: UUID
    usuario_id_2: UUID
    estado: EstadoAmistad
    fecha_solicitud: datetime
    fecha_respuesta: datetime | None
