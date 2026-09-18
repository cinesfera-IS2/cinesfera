from datetime import datetime
from uuid import UUID

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator
)

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


class UsuarioLogin(BaseModel):
    identificador: str
    password: str

    @field_validator("identificador")
    @classmethod
    def normalizar_identificador(cls, identificador: str) -> str:
        return identificador.strip().lower()


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


class UsuarioActualizacion(BaseModel):
    nombre: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    apellido: str | None = Field(
        default=None,
        min_length=2,
        max_length=50
    )

    nombre_usuario: str | None = Field(
        default=None,
        min_length=3,
        max_length=30,
        pattern=r"^[a-z0-9._]+$"
    )

    email: EmailStr | None = None

    # Enviar null elimina la foto actual.
    foto_url: AnyHttpUrl | None = None

    @field_validator(
        "nombre",
        "apellido",
        "nombre_usuario",
        "email",
        mode="before"
    )
    @classmethod
    def rechazar_nulos(cls, valor: str | None) -> str:
        if valor is None:
            raise ValueError("El campo no puede ser nulo")

        return valor

    @field_validator("nombre", "apellido", mode="before")
    @classmethod
    def limpiar_nombre_apellido(cls, valor: str) -> str:
        return valor.strip() if isinstance(valor, str) else valor

    @field_validator("nombre_usuario", mode="before")
    @classmethod
    def normalizar_nombre_usuario(cls, valor: str) -> str:
        return valor.strip().lower() if isinstance(valor, str) else valor

    @field_validator("email", mode="before")
    @classmethod
    def normalizar_email(cls, valor: str) -> str:
        return valor.strip().lower() if isinstance(valor, str) else valor

    @model_validator(mode="after")
    def verificar_al_menos_un_cambio(self):
        if not self.model_fields_set:
            raise ValueError("Debe enviar al menos un campo para actualizar")

        return self
