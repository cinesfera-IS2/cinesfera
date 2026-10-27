from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.enums import EstadoUsuario
from app.models.usuario import Usuario
from app.schemas.busqueda_usuarios import BusquedaUsuariosRespuesta, UsuarioEncontrado


def buscar_usuarios(
    db: Session, texto: str, limite: int, offset: int
) -> BusquedaUsuariosRespuesta:
    texto = texto.strip().lower()
    if not texto:
        return BusquedaUsuariosRespuesta(usuarios=[], hay_mas=False)

    nombre_completo = Usuario.nombre + " " + Usuario.apellido
    consulta = (
        select(Usuario)
        .where(
            Usuario.estado == EstadoUsuario.ACTIVO,
            or_(
                func.lower(nombre_completo).contains(texto, autoescape=True),
                func.lower(Usuario.nombre_usuario).contains(texto, autoescape=True),
            ),
        )
        .order_by(func.lower(Usuario.nombre_usuario), Usuario.id)
        .offset(offset)
        .limit(limite + 1)
    )
    usuarios = db.scalars(consulta).all()
    return BusquedaUsuariosRespuesta(
        usuarios=[UsuarioEncontrado.model_validate(u) for u in usuarios[:limite]],
        hay_mas=len(usuarios) > limite,
    )
