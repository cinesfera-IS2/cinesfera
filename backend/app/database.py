from sqlalchemy import URL, create_engine, make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


DRIVER = "postgresql+psycopg"


def construir_database_url() -> URL:
    """Arma la URL de conexión a la base de datos.

    Si `DATABASE_URL` está definida (es lo que entrega Render o la
    cadena de conexión de Supabase) se usa esa. Si no, se arma a partir
    de `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
    """
    if settings.database_url:
        url = make_url(settings.database_url)
        url = url.set(drivername=DRIVER)

        if "sslmode" not in url.query:
            url = url.update_query_dict(
                {"sslmode": settings.db_sslmode}
            )

        return url

    return URL.create(
        drivername=DRIVER,
        username=settings.db_user,
        password=settings.db_password,
        host=settings.db_host,
        port=settings.db_port,
        database=settings.db_name,
        query={"sslmode": settings.db_sslmode},
    )


DATABASE_URL = construir_database_url()


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    pool_recycle=300
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
