from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.csrf import verificar_csrf

from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioActualizacion, UsuarioRespuesta
from app.schemas.perfil_publico import PerfilPublicoRespuesta
from app.services.usuario_service import (
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    UsuarioNoEncontradoError,
    actualizar_perfil,
    obtener_perfil,
    obtener_perfil_publico,
    obtener_perfil_publico_por_nombre
)


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get(
    "/por-nombre/{nombre_usuario}/perfil-publico",
    response_model=PerfilPublicoRespuesta
)
def consultar_perfil_publico_por_nombre(
    nombre_usuario: str,
    db: Annotated[Session, Depends(get_db)]
) -> PerfilPublicoRespuesta:
    try:
        return obtener_perfil_publico_por_nombre(db, nombre_usuario)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{usuario_id}/perfil-publico", response_model=PerfilPublicoRespuesta)
def consultar_perfil_publico(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)]
) -> PerfilPublicoRespuesta:
    try:
        return obtener_perfil_publico(db, usuario_id)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get(
    "/{usuario_id}/perfil",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK
)
def consultar_perfil(
    usuario_id: UUID,
    db: Annotated[
        Session, 
        Depends(get_db)],

    usuario_actual: Annotated[
        Usuario, 
        Depends(obtener_usuario_actual)
    ]
) -> UsuarioRespuesta:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para consultar este perfil"
        )

    try:
        return obtener_perfil(db, usuario_id)

    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error
      


@router.patch(
    "/{usuario_id}/perfil",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)


def modificar_perfil(
    usuario_id: UUID,
    datos: UsuarioActualizacion,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> UsuarioRespuesta:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para actualizar este perfil"
        )

    try:
        return actualizar_perfil(db, usuario_id, datos)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error
    except (
        EmailDuplicadoError,
        NombreUsuarioDuplicadoError
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No fue posible actualizar el perfil"
        ) from error
