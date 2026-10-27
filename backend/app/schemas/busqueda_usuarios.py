from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UsuarioEncontrado(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    foto_url: str | None


class BusquedaUsuariosRespuesta(BaseModel):
    usuarios: list[UsuarioEncontrado]
    hay_mas: bool
