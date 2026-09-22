from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import DateTime, Integer, Numeric, SmallInteger, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Resena(Base):
    __tablename__ = "resenas"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), nullable=False)
    contenido_tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    plataforma_id: Mapped[int | None] = mapped_column(Integer)
    calificacion: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ValoracionResena(Base):
    __tablename__ = "valoraciones_resena"
    __table_args__ = {"schema": "public"}

    usuario_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True
    )
    resena_id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True)
    valor: Mapped[int] = mapped_column(SmallInteger, nullable=False)
