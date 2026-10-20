from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.csrf import verificar_csrf

from app.database import get_db
from app.dependencies.auth import (
    obtener_administrador_actual,
    obtener_usuario_actual
)
from app.models.usuario import Usuario
from app.schemas.usuario import (
    CambioPassword,
    UsuarioActualizacion,
    UsuarioRespuesta
)
from app.schemas.perfil_publico import PerfilPublicoRespuesta
from app.services.usuario_service import (
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    PasswordActualInvalidaError,
    TransicionEstadoInvalidaError,
    UsuarioNoEncontradoError,
    actualizar_perfil,
    cambiar_password,
    eliminar_usuario,
    obtener_perfil,
    obtener_perfil_publico,
    obtener_perfil_publico_por_nombre,
    suspender_usuario
)


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.patch(
    "/{usuario_id}/suspender",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)
def suspender_cuenta(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _administrador: Annotated[
        Usuario,
        Depends(obtener_administrador_actual)
    ]
) -> UsuarioRespuesta:
    try:
        return suspender_usuario(db, usuario_id)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error
    except TransicionEstadoInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error


@router.delete(
    "/{usuario_id}",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)
def eliminar_cuenta(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _administrador: Annotated[
        Usuario,
        Depends(obtener_administrador_actual)
    ]
) -> UsuarioRespuesta:
    try:
        return eliminar_usuario(db, usuario_id)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error


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


@router.patch(
    "/{usuario_id}/password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_csrf)]
)
def modificar_password(
    usuario_id: UUID,
    datos: CambioPassword,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Response:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para cambiar esta contraseña"
        )

    try:
        cambiar_password(
            db,
            usuario_actual,
            datos.password_actual,
            datos.password_nueva
        )
    except PasswordActualInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        ) from error

    return Response(status_code=status.HTTP_204_NO_CONTENT)
