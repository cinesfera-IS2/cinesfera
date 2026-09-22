from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import generar_hash_password, verificar_password
from app.models.usuario import Usuario
from app.models.resena import Resena, ValoracionResena
from app.schemas.perfil_publico import PerfilPublicoRespuesta, ResenaPublica
from app.schemas.usuario import (
    UsuarioActualizacion,
    UsuarioLogin,
    UsuarioRegistro
)
from app.core.enums import EstadoUsuario, RolUsuario


class EmailDuplicadoError(Exception):
    pass

class NombreUsuarioDuplicadoError(Exception):
    pass


class CredencialesInvalidasError(Exception):
    pass


class UsuarioNoEncontradoError(Exception):
    pass


def obtener_perfil_publico(db: Session, usuario_id: UUID) -> PerfilPublicoRespuesta:
    usuario = obtener_perfil(db, usuario_id)
    resenas = db.scalars(
        select(Resena).where(Resena.usuario_id == usuario_id)
        .order_by(Resena.fecha.desc(), Resena.id.desc())
    ).all()
    reputacion = db.scalar(
        select(func.coalesce(func.sum(ValoracionResena.valor), 0))
        .join(Resena, ValoracionResena.resena_id == Resena.id)
        .where(Resena.usuario_id == usuario_id)
    )
    return PerfilPublicoRespuesta(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        nombre_usuario=usuario.nombre_usuario,
        foto_url=usuario.foto_url,
        reputacion=int(reputacion or 0),
        resenas=[ResenaPublica.model_validate(resena, from_attributes=True)
                 for resena in resenas]
    )


def obtener_perfil(
    db: Session,
    usuario_id: UUID
) -> Usuario:
    usuario = db.get(Usuario, usuario_id)

    if usuario is None:
        raise UsuarioNoEncontradoError(
            "Usuario no encontrado"
        )

    return usuario


def actualizar_perfil(
    db: Session,
    usuario_id: UUID,
    datos: UsuarioActualizacion
) -> Usuario:
    usuario = obtener_perfil(db, usuario_id)
    cambios = datos.model_dump(exclude_unset=True)

    nuevo_email = cambios.get("email")
    if nuevo_email is not None:
        nuevo_email = str(nuevo_email).lower()
        cambios["email"] = nuevo_email

        email_en_uso = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.email) == nuevo_email,
                Usuario.id != usuario_id
            )
        )

        if email_en_uso is not None:
            raise EmailDuplicadoError(
                "El email ya está registrado"
            )

    nuevo_nombre_usuario = cambios.get("nombre_usuario")
    if nuevo_nombre_usuario is not None:
        nuevo_nombre_usuario = nuevo_nombre_usuario.lower()
        cambios["nombre_usuario"] = nuevo_nombre_usuario

        nombre_en_uso = db.scalar(
            select(Usuario).where(
                func.lower(Usuario.nombre_usuario)
                == nuevo_nombre_usuario,
                Usuario.id != usuario_id
            )
        )

        if nombre_en_uso is not None:
            raise NombreUsuarioDuplicadoError(
                "El nombre de usuario ya está registrado"
            )

    if "foto_url" in cambios and cambios["foto_url"] is not None:
        cambios["foto_url"] = str(cambios["foto_url"])

    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()

        if nuevo_email is not None and db.scalar(
            select(Usuario).where(
                func.lower(Usuario.email) == nuevo_email,
                Usuario.id != usuario_id
            )
        ) is not None:
            raise EmailDuplicadoError(
                "El email ya está registrado"
            ) from error

        if nuevo_nombre_usuario is not None and db.scalar(
            select(Usuario).where(
                func.lower(Usuario.nombre_usuario)
                == nuevo_nombre_usuario,
                Usuario.id != usuario_id
            )
        ) is not None:
            raise NombreUsuarioDuplicadoError(
                "El nombre de usuario ya está registrado"
            ) from error

        raise error

    db.refresh(usuario)
    return usuario


def iniciar_sesion(
    db: Session,
    datos: UsuarioLogin
) -> Usuario:
    campo_identificador = (
        Usuario.email
        if "@" in datos.identificador
        else Usuario.nombre_usuario
    )

    usuario = db.scalar(
        select(Usuario).where(
            func.lower(campo_identificador)
            == datos.identificador
        )
    )

    if usuario is None or not verificar_password(
        datos.password,
        usuario.password_hash
    ):
        raise CredencialesInvalidasError(
            "Credenciales inválidas"
        )

    return usuario


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
