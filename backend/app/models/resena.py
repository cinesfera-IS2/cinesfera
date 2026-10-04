from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, SmallInteger, Text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.contenido import Contenido


class Resena(Base):
    __tablename__ = "resenas"
    __table_args__ = {"schema": "public"}

    id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True)
    usuario_id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), nullable=False)
    contenido_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    plataforma_id: Mapped[int | None] = mapped_column(Integer)
    calificacion: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Se trae siempre junto con la reseña (un JOIN, no una consulta por fila):
    # toda respuesta pública identifica el contenido por su id de TMDB.
    # La FK la garantiza la base; como el modelo no la declara (igual que
    # usuario_id), el join se indica a mano.
    contenido: Mapped[Contenido] = relationship(
        primaryjoin="foreign(Resena.contenido_id) == Contenido.id",
        lazy="joined",
        innerjoin=True,
    )

    @property
    def contenido_tmdb_id(self) -> int:
        return self.contenido.tmdb_id


class ValoracionResena(Base):
    __tablename__ = "valoraciones_resena"
    __table_args__ = {"schema": "public"}

    usuario_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True), primary_key=True
    )
    resena_id: Mapped[UUID] = mapped_column(PostgreSQLUUID(as_uuid=True), primary_key=True)
    valor: Mapped[int] = mapped_column(SmallInteger, nullable=False)
