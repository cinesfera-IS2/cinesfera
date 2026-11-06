"""Crea las tablas de Cinesfera en la base vacía de los tests e2e.

Se corre desde `backend` con `DATABASE_URL` apuntando a esa base. Las tablas
salen de los modelos, así que siempre coinciden con lo que usa el código.
"""

from sqlalchemy.dialects.postgresql import ENUM

import app.models  # noqa: F401  (registra todas las tablas en Base.metadata)
from app.database import Base, engine


def crear_esquema() -> None:
    # Los modelos declaran los enums con create_type=False porque en Supabase
    # ya existen; acá hay que crearlos antes que las tablas que los usan.
    enums = {
        columna.type.name: columna.type
        for tabla in Base.metadata.tables.values()
        for columna in tabla.columns
        if isinstance(columna.type, ENUM)
    }

    with engine.begin() as conexion:
        for tipo in enums.values():
            tipo.create(conexion, checkfirst=True)
        Base.metadata.create_all(conexion)


if __name__ == "__main__":
    crear_esquema()
