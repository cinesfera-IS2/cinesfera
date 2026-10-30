from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import exists, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, aliased

from app.core.csrf import verificar_csrf
from app.core.enums import EstadoUsuario, RolUsuario
from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.models.seguimiento import Seguimiento
from app.models.usuario import Usuario
from app.schemas.seguimiento import (
    EstadoSeguimientoRespuesta,
    SeguimientoRespuesta,
    UsuarioSeguimientoRespuesta
)


router = APIRouter(prefix="/usuarios", tags=["Seguimientos"])


def _obtener_usuario_activo(db: Session, usuario_id: UUID) -> Usuario:
    usuario = db.get(Usuario, usuario_id)
    if usuario is None or usuario.estado != EstadoUsuario.ACTIVO or usuario.rol != RolUsuario.USUARIO:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return usuario


def _exigir_cuenta_social(usuario: Usuario) -> None:
    if usuario.rol == RolUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las cuentas administrativas no participan en funciones sociales",
        )


def _existe_seguimiento(
    db: Session,
    seguidor_id: UUID,
    seguido_id: UUID
) -> bool:
    return db.get(Seguimiento, (seguidor_id, seguido_id)) is not None


def _estado_entre(
    db: Session,
    usuario_actual_id: UUID,
    otro_usuario_id: UUID
) -> EstadoSeguimientoRespuesta:
    siguiendo = _existe_seguimiento(
        db, usuario_actual_id, otro_usuario_id
    )
    te_sigue = _existe_seguimiento(
        db, otro_usuario_id, usuario_actual_id
    )
    return EstadoSeguimientoRespuesta(
        siguiendo=siguiendo,
        te_sigue=te_sigue,
        son_amigos=siguiendo and te_sigue
    )


@router.post(
    "/{usuario_id}/seguir",
    response_model=SeguimientoRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_csrf)]
)
def seguir_usuario(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> SeguimientoRespuesta:
    _exigir_cuenta_social(usuario_actual)
    if usuario_id == usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede seguirse a sí mismo"
        )
    _obtener_usuario_activo(db, usuario_id)
    if _existe_seguimiento(db, usuario_actual.id, usuario_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya sigue a este usuario"
        )

    seguimiento = Seguimiento(
        seguidor_id=usuario_actual.id,
        seguido_id=usuario_id,
        fecha_seguimiento=datetime.now(timezone.utc)
    )
    db.add(seguimiento)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya sigue a este usuario"
        ) from error
    db.refresh(seguimiento)

    return SeguimientoRespuesta(
        seguidor_id=seguimiento.seguidor_id,
        seguido_id=seguimiento.seguido_id,
        fecha_seguimiento=seguimiento.fecha_seguimiento,
        son_amigos=_existe_seguimiento(
            db, usuario_id, usuario_actual.id
        )
    )


@router.delete(
    "/{usuario_id}/seguir",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_csrf)]
)
def dejar_de_seguir_usuario(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Response:
    _exigir_cuenta_social(usuario_actual)
    seguimiento = db.get(
        Seguimiento, (usuario_actual.id, usuario_id)
    )
    if seguimiento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sigue a este usuario"
        )

    db.delete(seguimiento)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/{usuario_id}/seguimiento",
    response_model=EstadoSeguimientoRespuesta
)
def consultar_estado_seguimiento(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> EstadoSeguimientoRespuesta:
    _exigir_cuenta_social(usuario_actual)
    _obtener_usuario_activo(db, usuario_id)
    if usuario_id == usuario_actual.id:
        return EstadoSeguimientoRespuesta(
            siguiendo=False,
            te_sigue=False,
            son_amigos=False
        )
    return _estado_entre(db, usuario_actual.id, usuario_id)


def _usuarios_seguidos_por(
    db: Session,
    usuario_id: UUID
) -> list[Usuario]:
    return list(db.scalars(
        select(Usuario)
        .join(
            Seguimiento,
            Seguimiento.seguido_id == Usuario.id
        )
        .where(
            Seguimiento.seguidor_id == usuario_id,
            Usuario.estado == EstadoUsuario.ACTIVO,
            Usuario.rol == RolUsuario.USUARIO,
        )
        .order_by(Usuario.nombre_usuario)
    ).all())


@router.get(
    "/{usuario_id}/seguidores",
    response_model=list[UsuarioSeguimientoRespuesta]
)
def listar_seguidores(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)]
) -> list[Usuario]:
    _obtener_usuario_activo(db, usuario_id)
    return list(db.scalars(
        select(Usuario)
        .join(
            Seguimiento,
            Seguimiento.seguidor_id == Usuario.id
        )
        .where(
            Seguimiento.seguido_id == usuario_id,
            Usuario.estado == EstadoUsuario.ACTIVO,
            Usuario.rol == RolUsuario.USUARIO,
        )
        .order_by(Usuario.nombre_usuario)
    ).all())


@router.get(
    "/{usuario_id}/seguidos",
    response_model=list[UsuarioSeguimientoRespuesta]
)
def listar_seguidos(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)]
) -> list[Usuario]:
    _obtener_usuario_activo(db, usuario_id)
    return _usuarios_seguidos_por(db, usuario_id)


@router.get(
    "/{usuario_id}/amigos",
    response_model=list[UsuarioSeguimientoRespuesta]
)
def listar_amigos(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> list[Usuario]:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para consultar estos amigos"
        )

    _obtener_usuario_activo(db, usuario_id)
    seguimiento_inverso = aliased(Seguimiento)
    return list(db.scalars(
        select(Usuario)
        .join(
            Seguimiento,
            Seguimiento.seguido_id == Usuario.id
        )
        .where(
            Seguimiento.seguidor_id == usuario_id,
            Usuario.estado == EstadoUsuario.ACTIVO,
            Usuario.rol == RolUsuario.USUARIO,
            exists(
                select(1).where(
                    seguimiento_inverso.seguidor_id == Usuario.id,
                    seguimiento_inverso.seguido_id == usuario_id
                )
            )
        )
        .order_by(Usuario.nombre_usuario)
    ).all())
