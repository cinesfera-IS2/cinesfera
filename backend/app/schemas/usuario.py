from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import EstadoUsuario, RolUsuario


class UsuarioRegistro(BaseModel):
    nombre: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    @field_validator("nombre")
    @classmethod
    def limpiar_nombre(cls, nombre: str) -> str:
        return nombre.strip()

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email(cls, email: str) -> str:
        return email.strip().lower()


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    email: EmailStr
    foto_url: str | None
    rol: RolUsuario
    estado: EstadoUsuario
    fecha_registro: datetime