from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.usuario import (
    TokenRespuesta,
    UsuarioLogin,
    UsuarioRegistro,
    UsuarioRespuesta
)

from app.services.usuario_service import (
    CredencialesInvalidasError,
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    iniciar_sesion,
    registrar_usuario
)

from app.core.security import generar_token_acceso


from app.dependencies.auth import obtener_usuario_actual
from app.models.usuario import Usuario


import os
from fastapi import Response

from app.core.security import (
    generar_token_acceso,
    JWT_EXPIRE_MINUTES
)
from app.schemas.usuario import SesionRespuesta

router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


@router.post(
    "/login",
    response_model=SesionRespuesta,
    status_code=status.HTTP_200_OK
)
def login(
    datos: UsuarioLogin,
    response: Response,
    db: Annotated[Session, Depends(get_db)]
) -> SesionRespuesta:
    try:
        usuario = iniciar_sesion(db, datos)

        token = generar_token_acceso(usuario.id)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=os.getenv(
                "COOKIE_SECURE", "true"
            ).lower() == "true",
            samesite="lax",
            max_age=JWT_EXPIRE_MINUTES * 60,
            path="/"
        )

        return SesionRespuesta(
            mensaje="Sesión iniciada correctamente"
        )

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



@router.get(
    "/me",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK
)
def obtener_perfil(
    usuario_actual: Annotated[
        Usuario,
        Depends(obtener_usuario_actual)
    ]
) -> UsuarioRespuesta:
    return usuario_actual



@router.post(
    "/logout",
    response_model=SesionRespuesta,
    status_code=status.HTTP_200_OK
)
def cerrar_sesion(
    response: Response
) -> SesionRespuesta:

    response.delete_cookie(
        key="access_token",
        path="/"
    )

    return SesionRespuesta(
        mensaje="Sesión cerrada correctamente"
    )