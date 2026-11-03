from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import EstadoResena
from app.models.resena import CalificacionResena, Resena
from app.models.usuario import Usuario


DOS_DECIMALES = Decimal("0.01")


def recalcular_reputacion(db: Session, usuario_id: UUID) -> Decimal:
    """Persiste el promedio vigente sin confirmar la transaccion actual."""
    usuario = db.scalar(
        select(Usuario).where(Usuario.id == usuario_id).with_for_update()
    )
    promedio = db.scalar(
        select(func.avg(CalificacionResena.calificacion))
        .join(Resena, Resena.id == CalificacionResena.resena_id)
        .where(
            Resena.usuario_id == usuario_id,
            Resena.resena_padre_id.is_(None),
            Resena.estado != EstadoResena.ELIMINADA,
        )
    )
    reputacion = (
        Decimal(str(promedio)).quantize(DOS_DECIMALES, rounding=ROUND_HALF_UP)
        if promedio is not None
        else Decimal("0.00")
    )
    usuario.reputacion = reputacion
    db.flush([usuario])
    return reputacion
