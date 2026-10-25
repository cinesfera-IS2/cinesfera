from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Seguimiento(Base):
    __tablename__ = "seguimientos"
    __table_args__ = (
        CheckConstraint(
            "seguidor_id <> seguido_id",
            name="ck_seguimientos_usuarios_distintos"
        ),
        Index("ix_seguimientos_seguido_id", "seguido_id"),
        {"schema": "public"}
    )

    seguidor_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("public.usuarios.id", ondelete="CASCADE"),
        primary_key=True
    )
    seguido_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("public.usuarios.id", ondelete="CASCADE"),
        primary_key=True
    )
    fecha_seguimiento: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
