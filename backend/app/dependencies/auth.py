
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decodificar_token_acceso
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

    return usuario