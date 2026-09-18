from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decodificar_token_acceso
from app.database import get_db
from app.models.usuario import Usuario


bearer_scheme = HTTPBearer()


def obtener_usuario_actual(
    credenciales: Annotated[
        HTTPAuthorizationCredentials,
        Depends(bearer_scheme)
    ],
    db: Annotated[Session, Depends(get_db)]
) -> Usuario:
    try:
        usuario_id = decodificar_token_acceso(
            credenciales.credentials
        )

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