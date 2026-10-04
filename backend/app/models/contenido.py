from sqlalchemy import BigInteger, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Contenido(Base):
    """Película, serie o episodio que tiene reseñas en Cinesfera.

    La ficha completa vive en TMDB; acá solo se guarda lo necesario para
    identificarlo. Un mismo `tmdb_id` puede ser una película y una serie
    distintas, por eso la identidad incluye el `tipo`.
    """

    __tablename__ = "contenidos"
    __table_args__ = {"schema": "public"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    tmdb_id: Mapped[int] = mapped_column(Integer, nullable=False)
    # pelicula | serie | episodio
    tipo: Mapped[str] = mapped_column(Text, nullable=False)
    temporada: Mapped[int | None] = mapped_column(Integer)
    episodio: Mapped[int | None] = mapped_column(Integer)
    titulo: Mapped[str | None] = mapped_column(Text)
