from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()")
    )

    nombre: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    foto_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    rol: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'usuario'")
    )

    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'activo'")
    )

    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )