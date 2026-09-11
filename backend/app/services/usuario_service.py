from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import generar_hash_password
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioRegistro
from app.core.enums import EstadoUsuario, RolUsuario


class EmailDuplicadoError(Exception):
    pass

class NombreUsuarioDuplicadoError(Exception):
    pass


def registrar_usuario(
    db: Session,
    datos: UsuarioRegistro
) -> Usuario:
    email_normalizado = str(datos.email).lower()
    nombre_usuario_normalizado = (
        datos.nombre_usuario.lower()
    )

    usuario_con_email = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.email)
            == email_normalizado
        )
    )

    if usuario_con_email is not None:
        raise EmailDuplicadoError(
            "El email ya está registrado"
        )

    usuario_con_nombre_usuario = db.scalar(
        select(Usuario).where(
            func.lower(Usuario.nombre_usuario)
            == nombre_usuario_normalizado
        )
    )

    if usuario_con_nombre_usuario is not None:
        raise NombreUsuarioDuplicadoError(
            "El nombre de usuario ya está registrado"
        )

    usuario = Usuario(
        nombre=datos.nombre,
        apellido=datos.apellido,
        nombre_usuario=nombre_usuario_normalizado,
        email=email_normalizado,
        password_hash=generar_hash_password(
            datos.password
        ),
        rol=RolUsuario.USUARIO,
        estado=EstadoUsuario.ACTIVO
    )

    db.add(usuario)

    try:
        db.commit()

    except IntegrityError as error:
        db.rollback()

        usuario_con_email = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.email)
                == email_normalizado
            )
        )

        if usuario_con_email is not None:
            raise EmailDuplicadoError(
                "El email ya está registrado"
            ) from error

        usuario_con_nombre_usuario = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.nombre_usuario)
                == nombre_usuario_normalizado
            )
        )

        if usuario_con_nombre_usuario is not None:
            raise NombreUsuarioDuplicadoError(
                "El nombre de usuario ya está registrado"
            ) from error

        raise

    db.refresh(usuario)

    return usuario