from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import ENUM as PostgreSQLEnum, UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import AccionModeracion, EstadoReporte, MotivoReporte, TipoReporte
from app.database import Base


def _enum(tipo, nombre: str):
    return PostgreSQLEnum(
        tipo,
        name=nombre,
        schema="public",
        create_type=False,
        values_callable=lambda enum: [elemento.value for elemento in enum],
    )


class Reporte(Base):
    __tablename__ = "reportes"
    __table_args__ = (
        UniqueConstraint(
            "reportante_id", "objetivo_clave", name="uq_reporte_reportante_objetivo"
        ),
        {"schema": "public"},
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    reportante_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=False, index=True
    )
    tipo: Mapped[TipoReporte] = mapped_column(
        _enum(TipoReporte, "tipo_reporte"), nullable=False, index=True
    )
    objetivo_clave: Mapped[str] = mapped_column(String(80), nullable=False)
    usuario_reportado_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=True, index=True
    )
    resena_reportada_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=True, index=True
    )
    motivo: Mapped[MotivoReporte] = mapped_column(
        _enum(MotivoReporte, "motivo_reporte"), nullable=False, index=True
    )
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    contenido_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[EstadoReporte] = mapped_column(
        _enum(EstadoReporte, "estado_reporte"),
        nullable=False,
        default=EstadoReporte.PENDIENTE,
        server_default=text("'pendiente'::public.estado_reporte"),
        index=True,
    )
    administrador_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=True, index=True
    )
    resolucion: Mapped[str | None] = mapped_column(Text, nullable=True)
    nota_interna: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class AuditoriaModeracion(Base):
    __tablename__ = "auditoria_moderacion"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    administrador_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=False, index=True
    )
    accion: Mapped[AccionModeracion] = mapped_column(
        _enum(AccionModeracion, "accion_moderacion"), nullable=False, index=True
    )
    tipo_objetivo: Mapped[str] = mapped_column(String(30), nullable=False)
    objetivo_id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), nullable=False)
    reporte_id: Mapped[UUID | None] = mapped_column(
        PostgreSQLUUID(as_uuid=True), nullable=True, index=True
    )
    estado_anterior: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado_nuevo: Mapped[str | None] = mapped_column(Text, nullable=True)
    motivo: Mapped[str] = mapped_column(Text, nullable=False)
    nota_interna: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
