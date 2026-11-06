from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.csrf import verificar_csrf
from app.core.enums import EstadoUsuario, RolUsuario
from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.models.notificacion import Notificacion
from app.models.usuario import Usuario
from app.schemas.notificacion import (
    ActorNotificacionRespuesta,
    BandejaNotificacionesRespuesta,
    NotificacionRespuesta,
)


router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


def _a_respuesta(
    notificacion: Notificacion,
    actor: Usuario,
) -> NotificacionRespuesta:
    return NotificacionRespuesta(
        id=notificacion.id,
        tipo=notificacion.tipo,
        leida=notificacion.leida,
        fecha=notificacion.fecha,
        actor=ActorNotificacionRespuesta(
            id=actor.id,
            nombre=actor.nombre,
            apellido=actor.apellido,
            nombre_usuario=actor.nombre_usuario,
            foto_url=actor.foto_url,
        ),
    )


@router.get("", response_model=BandejaNotificacionesRespuesta)
def listar_notificaciones(
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)],
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
) -> BandejaNotificacionesRespuesta:
    visibles = (
        Notificacion.usuario_id == usuario_actual.id,
        Usuario.estado == EstadoUsuario.ACTIVO,
        Usuario.rol == RolUsuario.USUARIO,
    )
    filas = db.execute(
        select(Notificacion, Usuario)
        .join(Usuario, Notificacion.actor_id == Usuario.id)
        .where(*visibles)
        .order_by(Notificacion.fecha.desc(), Notificacion.id.desc())
        .limit(limite)
    ).all()
    no_leidas = db.scalar(
        select(func.count())
        .select_from(Notificacion)
        .join(Usuario, Notificacion.actor_id == Usuario.id)
        .where(*visibles, Notificacion.leida.is_(False))
    )
    return BandejaNotificacionesRespuesta(
        items=[_a_respuesta(notificacion, actor) for notificacion, actor in filas],
        no_leidas=int(no_leidas or 0),
    )


@router.patch(
    "/leer-todas",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_csrf)],
)
def marcar_todas_como_leidas(
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)],
) -> Response:
    db.execute(
        update(Notificacion)
        .where(
            Notificacion.usuario_id == usuario_actual.id,
            Notificacion.leida.is_(False),
        )
        .values(leida=True)
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch(
    "/{notificacion_id}/leer",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_csrf)],
)
def marcar_como_leida(
    notificacion_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)],
) -> Response:
    notificacion = db.scalar(
        select(Notificacion).where(
            Notificacion.id == notificacion_id,
            Notificacion.usuario_id == usuario_actual.id,
        )
    )
    if notificacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada",
        )

    if not notificacion.leida:
        notificacion.leida = True
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
