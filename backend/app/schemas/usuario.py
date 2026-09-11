from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import EstadoUsuario, RolUsuario


class UsuarioRegistro(BaseModel):
    nombre: str = Field(
        min_length=2,
        max_length=100
    )

    apellido: str = Field(
        min_length=2,
        max_length=50
    )

    nombre_usuario: str = Field(
        min_length=3,
        max_length=30,
        pattern=r"^[a-z0-9._]+$"
    )
    
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    @field_validator("nombre", "apellido", mode="before")
    @classmethod
    def limpiar_nombre_apellido(cls, valor: str) -> str:
        if isinstance(valor, str):
            return valor.strip()

        return valor


    @field_validator("nombre_usuario", mode="before")
    @classmethod
    def normalizar_nombre_usuario(
        cls,
        nombre_usuario: str
    ) -> str:
        if isinstance(nombre_usuario, str):
            return nombre_usuario.strip().lower()

        return nombre_usuario


    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email(cls, email: str) -> str:
        return email.strip().lower()


class UsuarioRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    email: EmailStr
    foto_url: str | None
    rol: RolUsuario
    estado: EstadoUsuario
    fecha_registro: datetime