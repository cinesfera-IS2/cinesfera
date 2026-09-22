from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.enums import EstadoAmistad
from app.dependencies.auth import obtener_usuario_actual
from app.models.amistad import Amistad
from app.models.usuario import Usuario
from app.schemas.amistad import SolicitudAmistadCreacion, SolicitudAmistadRespuesta


router = APIRouter(prefix="/amistades", tags=["Amistades"])


def buscar_relacion(db: Session, primero: UUID, segundo: UUID) -> Amistad | None:
    return db.scalar(select(Amistad).where(or_(
        and_(Amistad.usuario_id_1 == primero, Amistad.usuario_id_2 == segundo),
        and_(Amistad.usuario_id_1 == segundo, Amistad.usuario_id_2 == primero)
    )))


@router.post("/solicitudes", response_model=SolicitudAmistadRespuesta, status_code=201)
def enviar_solicitud(
    datos: SolicitudAmistadCreacion,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Amistad:
    if datos.destinatario_id == usuario_actual.id:
        raise HTTPException(status_code=400, detail="No puede enviarse una solicitud a sí mismo")
    destinatario = db.get(Usuario, datos.destinatario_id)
    if destinatario is None:
        raise HTTPException(status_code=404, detail="Usuario destinatario no encontrado")
    if buscar_relacion(db, usuario_actual.id, datos.destinatario_id):
        raise HTTPException(status_code=409, detail="Ya existe una relación entre estos usuarios")

    relacion = Amistad(
        usuario_id_1=usuario_actual.id, usuario_id_2=datos.destinatario_id,
        estado=EstadoAmistad.PENDIENTE, fecha_solicitud=datetime.now(timezone.utc)
    )
    db.add(relacion)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una relación entre estos usuarios") from error
    db.refresh(relacion)
    return relacion


def responder_solicitud(
    db: Session, remitente_id: UUID, usuario_actual: Usuario, estado: EstadoAmistad
) -> Amistad:
    relacion = db.get(Amistad, (remitente_id, usuario_actual.id))
    if relacion is None:
        raise HTTPException(status_code=404, detail="Solicitud de amistad no encontrada")
    if relacion.estado != EstadoAmistad.PENDIENTE:
        raise HTTPException(status_code=409, detail="La solicitud ya fue respondida")
    relacion.estado = estado
    relacion.fecha_respuesta = datetime.now(timezone.utc)
    db.commit()
    db.refresh(relacion)
    return relacion


@router.post("/solicitudes/{remitente_id}/aceptar", response_model=SolicitudAmistadRespuesta)
def aceptar_solicitud(
    remitente_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Amistad:
    return responder_solicitud(db, remitente_id, usuario_actual, EstadoAmistad.ACEPTADA)


@router.post("/solicitudes/{remitente_id}/rechazar", response_model=SolicitudAmistadRespuesta)
def rechazar_solicitud(
    remitente_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Amistad:
    return responder_solicitud(db, remitente_id, usuario_actual, EstadoAmistad.RECHAZADA)
