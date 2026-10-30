import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.enums import EstadoUsuario, RolUsuario
from app.core.security import generar_hash_password
from app.models.usuario import Usuario


logger = logging.getLogger(__name__)


def crear_administrador_inicial(db: Session, configuracion: Settings) -> Usuario | None:
    """Crea una única cuenta raíz desde el entorno, de forma idempotente."""
    administrador = db.scalar(
        select(Usuario).where(Usuario.rol == RolUsuario.ADMIN).limit(1)
    )
    if administrador is not None:
        return None

    if not (
        configuracion.admin_inicial_email
        and configuracion.admin_inicial_password
        and configuracion.admin_inicial_usuario
    ):
        logger.warning(
            "No existe un administrador y no se configuró ADMIN_INICIAL_*"
        )
        return None

    email = configuracion.admin_inicial_email.strip().lower()
    nombre_usuario = configuracion.admin_inicial_usuario.strip().lower()
    existente = db.scalar(
        select(Usuario).where(
            (func.lower(Usuario.email) == email)
            | (func.lower(Usuario.nombre_usuario) == nombre_usuario)
        )
    )
    if existente is not None:
        raise RuntimeError(
            "Las credenciales de ADMIN_INICIAL_* coinciden con una cuenta existente"
        )

    administrador = Usuario(
        nombre=configuracion.admin_inicial_nombre.strip(),
        apellido=configuracion.admin_inicial_apellido.strip(),
        nombre_usuario=nombre_usuario,
        email=email,
        password_hash=generar_hash_password(configuracion.admin_inicial_password),
        rol=RolUsuario.ADMIN,
        estado=EstadoUsuario.ACTIVO,
        es_admin_principal=True,
    )
    db.add(administrador)
    db.commit()
    db.refresh(administrador)
    logger.info("Se creó el administrador principal %s", nombre_usuario)
    return administrador
