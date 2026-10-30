from enum import Enum


class RolUsuario(str, Enum):
    USUARIO = "usuario"
    ADMIN = "admin"


class EstadoUsuario(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    ELIMINADO = "eliminado"


class TipoReporte(str, Enum):
    COMENTARIO = "comentario"
    USUARIO = "usuario"


class MotivoReporte(str, Enum):
    SPAM = "spam"
    ACOSO = "acoso"
    ODIO = "odio"
    CONTENIDO_INAPROPIADO = "contenido_inapropiado"
    SUPLANTACION = "suplantacion"
    INFORMACION_FALSA = "informacion_falsa"
    OTRO = "otro"


class EstadoReporte(str, Enum):
    PENDIENTE = "pendiente"
    EN_REVISION = "en_revision"
    RESUELTO = "resuelto"
    DESCARTADO = "descartado"


class EstadoResena(str, Enum):
    VISIBLE = "visible"
    OCULTA = "oculta"
    ELIMINADA = "eliminada"


class AccionModeracion(str, Enum):
    OCULTAR_COMENTARIO = "ocultar_comentario"
    RESTAURAR_COMENTARIO = "restaurar_comentario"
    ELIMINAR_COMENTARIO = "eliminar_comentario"
    SUSPENDER_USUARIO = "suspender_usuario"
    REACTIVAR_USUARIO = "reactivar_usuario"
    ELIMINAR_USUARIO = "eliminar_usuario"
    CREAR_ADMIN = "crear_admin"
    REVOCAR_ADMIN = "revocar_admin"
    ACTUALIZAR_REPORTE = "actualizar_reporte"
