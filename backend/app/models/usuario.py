from datetime import datetime
from uuid import UUID

from sqlalchemy import Boolean, JSON, DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import (
    ENUM as PostgreSQLEnum,
    UUID as PostgreSQLUUID
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import EstadoUsuario, RolUsuario
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
    String(50),
    nullable=False
    )

    apellido: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    nombre_usuario: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
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

    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    ubicacion: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    generos_favoritos: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        server_default=text("'[]'::json")
    )

    rol: Mapped[RolUsuario] = mapped_column(
        PostgreSQLEnum(
            RolUsuario,
            name="rol_usuario",
            schema="public",
            create_type=False,
            values_callable=lambda enum: [
                elemento.value
                for elemento in enum
            ]
        ),
        nullable=False,
        server_default=text(
            "'usuario'::public.rol_usuario"
        )
    )

    estado: Mapped[EstadoUsuario] = mapped_column(
        PostgreSQLEnum(
            EstadoUsuario,
            name="estado_usuario",
            schema="public",
            create_type=False,
            values_callable=lambda enum: [
                elemento.value
                for elemento in enum
            ]
        ),
        nullable=False,
        server_default=text(
            "'activo'::public.estado_usuario"
        )
    )

    es_admin_principal: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false")
    )

    suspension_hasta: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    motivo_suspension: Mapped[str | None] = mapped_column(Text, nullable=True)

    ocultar_contenido: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false")
    )

    fecha_registro: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
