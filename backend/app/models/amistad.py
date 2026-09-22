from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, Enum as SQLAlchemyEnum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import EstadoAmistad
from app.database import Base


class Amistad(Base):
    __tablename__ = "amistades"
    __table_args__ = {"schema": "public"}

    usuario_id_1: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("public.usuarios.id"), primary_key=True
    )
    usuario_id_2: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), ForeignKey("public.usuarios.id"), primary_key=True
    )
    estado: Mapped[EstadoAmistad] = mapped_column(
        SQLAlchemyEnum(
            EstadoAmistad,
            native_enum=False,
            values_callable=lambda enum: [elemento.value for elemento in enum],
            validate_strings=True
        ),
        nullable=False,
        server_default=EstadoAmistad.PENDIENTE.value
    )
    fecha_solicitud: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    fecha_respuesta: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
