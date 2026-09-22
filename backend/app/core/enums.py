from enum import Enum


class RolUsuario(str, Enum):
    USUARIO = "usuario"
    ADMIN = "admin"


class EstadoUsuario(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    ELIMINADO = "eliminado"


class EstadoAmistad(str, Enum):
    PENDIENTE = "pendiente"
    ACEPTADA = "aceptada"
    RECHAZADA = "rechazada"
