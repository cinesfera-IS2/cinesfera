from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import generar_hash_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioRegistro


class EmailDuplicadoError(Exception):
    pass


def registrar_usuario(
    db: Session,
    datos: UsuarioRegistro
) -> Usuario:
    email_normalizado = str(datos.email).lower()

    usuario_existente = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.email) == email_normalizado
        )
    )

    if usuario_existente is not None:
        raise EmailDuplicadoError(
            "El email ya está registrado"
        )

    usuario = Usuario(
        nombre=datos.nombre,
        email=email_normalizado,
        password_hash=generar_hash_password(
            datos.password
        ),
        rol="usuario",
        estado="activo"
    )

    db.add(usuario)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()

        if getattr(error.orig, "sqlstate", None) == "23505":
            raise EmailDuplicadoError(
                "El email ya está registrado"
            ) from error

        raise

    db.refresh(usuario)

    return usuario