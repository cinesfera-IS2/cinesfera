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
    bio: str | None
    ubicacion: str | None
    generos_favoritos: list[str]
    rol: RolUsuario
    estado: EstadoUsuario
    fecha_registro: datetime

class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"

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

    # Enviar null elimina estos datos opcionales.
    bio: str | None = Field(default=None, max_length=280)
    ubicacion: str | None = Field(default=None, max_length=100)
    generos_favoritos: list[str] | None = Field(
        default=None,
        max_length=5
    )

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

    @field_validator("bio", "ubicacion", mode="before")
    @classmethod
    def limpiar_texto_opcional(cls, valor: str | None) -> str | None:
        if not isinstance(valor, str):
            return valor
        limpio = valor.strip()
        return limpio or None

    @field_validator("generos_favoritos", mode="before")
    @classmethod
    def limpiar_generos(cls, valor):
        if valor is None:
            return []
        if not isinstance(valor, list):
            return valor

        generos = []
        vistos = set()
        for genero in valor:
            if not isinstance(genero, str):
                return valor
            limpio = genero.strip()
            clave = limpio.casefold()
            if not limpio or len(limpio) > 30:
                raise ValueError(
                    "Cada género debe tener entre 1 y 30 caracteres"
                )
            if clave not in vistos:
                vistos.add(clave)
                generos.append(limpio)
        return generos

    @model_validator(mode="after")
    def verificar_al_menos_un_cambio(self):
        if not self.model_fields_set:
            raise ValueError("Debe enviar al menos un campo para actualizar")

        return self


class CambioPassword(BaseModel):
    password_actual: str = Field(min_length=8, max_length=128)
    password_nueva: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def verificar_password_distinta(self):
        if self.password_actual == self.password_nueva:
            raise ValueError("La contraseña nueva debe ser distinta")
        return self

    


class SesionRespuesta(BaseModel):
    mensaje: str
    csrf_token: str | None = None


class CsrfRespuesta(BaseModel):
    csrf_token: str
