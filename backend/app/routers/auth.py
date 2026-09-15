from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import UsuarioLogin, UsuarioRegistro, UsuarioRespuesta
from app.services.usuario_service import (
    CredencialesInvalidasError,
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    iniciar_sesion,
    registrar_usuario
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post(
    "/login",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK
)
def login(
    datos: UsuarioLogin,
    db: Annotated[Session, Depends(get_db)]
) -> UsuarioRespuesta:
    try:
        return iniciar_sesion(db, datos)

    except CredencialesInvalidasError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        ) from error


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
