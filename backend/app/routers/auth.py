from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import UsuarioRegistro, UsuarioRespuesta
from app.services.usuario_service import (
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    registrar_usuario
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post(
    "/register",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_201_CREATED
)
def registrar(
    datos: UsuarioRegistro,
    db: Annotated[Session, Depends(get_db)]
) -> UsuarioRespuesta:
    try:
        return registrar_usuario(db, datos)

    except (
        EmailDuplicadoError,
        NombreUsuarioDuplicadoError
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error