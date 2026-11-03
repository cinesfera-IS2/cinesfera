from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, LargeBinary, String, func
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FotoPerfil(Base):
    """Imagen de perfil persistida aparte para no cargar el binario al leer usuarios."""

    __tablename__ = "fotos_perfil"
    __table_args__ = {"schema": "public"}

    usuario_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("public.usuarios.id", ondelete="CASCADE"),
        primary_key=True,
    )
    contenido: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    tipo_mime: Mapped[str] = mapped_column(String(20), nullable=False)
    actualizada_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        onupdate=func.now(),
    )
