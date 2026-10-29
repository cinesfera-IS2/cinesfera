
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.enums import EstadoUsuario, RolUsuario
from app.core.security import decodificar_token_acceso
from app.core.suspension import mensaje_cuenta_suspendida, suspension_vencida
from app.database import get_db
from app.models.usuario import Usuario


bearer_scheme = HTTPBearer(auto_error=False)


def obtener_usuario_actual(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    credenciales: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer_scheme)
    ]
) -> Usuario:

    # Primero buscamos el token en la cookie
    token = request.cookies.get("access_token")

    # Compatibilidad con el sistema anterior
    if not token and credenciales is not None:
        token = credenciales.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay una sesión activa"
        )

    try:
        usuario_id = decodificar_token_acceso(token)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        ) from error

    usuario = db.get(Usuario, usuario_id)

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )

    if (
        usuario.estado == EstadoUsuario.SUSPENDIDO
        and suspension_vencida(usuario.suspension_hasta)
    ):
        usuario.estado = EstadoUsuario.ACTIVO
        usuario.suspension_hasta = None
        usuario.motivo_suspension = None
        usuario.ocultar_contenido = False
        db.commit()

    if usuario.estado == EstadoUsuario.SUSPENDIDO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=mensaje_cuenta_suspendida(usuario.suspension_hasta),
            headers={"X-Account-Status": "suspendido"},
        )

    if usuario.estado == EstadoUsuario.ELIMINADO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta no está activa",
            headers={"X-Account-Status": "eliminado"},
        )

    return usuario


def obtener_administrador_actual(
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Usuario:
    if usuario_actual.rol != RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requieren permisos de administrador"
        )

    return usuario_actual


def obtener_usuario_reportante(
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Usuario:
    if usuario_actual.rol == RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los administradores no pueden generar reportes",
        )
    return usuario_actual
