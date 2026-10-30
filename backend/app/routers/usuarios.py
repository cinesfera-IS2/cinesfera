from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.core.csrf import verificar_csrf
from app.core.enums import AccionModeracion, RolUsuario

from app.database import get_db
from app.dependencies.auth import (
    obtener_administrador_actual,
    obtener_usuario_actual
)
from app.models.usuario import Usuario
from app.schemas.busqueda_usuarios import BusquedaUsuariosRespuesta
from app.schemas.moderacion import AccionReporteEntrada
from app.services.busqueda_usuarios import buscar_usuarios
from app.schemas.usuario import (
    CambioPassword,
    UsuarioActualizacion,
    UsuarioRespuesta
)
from app.schemas.perfil_publico import PerfilPublicoRespuesta
from app.services.usuario_service import (
    EmailDuplicadoError,
    NombreUsuarioDuplicadoError,
    PasswordActualInvalidaError,
    UsuarioNoEncontradoError,
    actualizar_perfil,
    cambiar_password,
    eliminar_usuario,
    obtener_perfil,
    obtener_perfil_publico,
    obtener_perfil_publico_por_nombre,
)
from app.services.contenido_service import (
    CatalogoNoDisponibleError,
    GeneroFavoritoInvalidoError,
    normalizar_generos_favoritos,
)
from app.services.moderacion_service import registrar_auditoria


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


def _auditoria_disponible(db: Session) -> bool:
    """Tolera esquemas históricos en pruebas; producción debe aplicar migraciones."""
    return inspect(db.get_bind()).has_table("auditoria_moderacion")


@router.get("/buscar", response_model=BusquedaUsuariosRespuesta)
def consultar_usuarios(
    db: Annotated[Session, Depends(get_db)],
    _usuario: Annotated[Usuario, Depends(obtener_usuario_actual)],
    q: Annotated[str, Query(max_length=150)] = "",
    limite: Annotated[int, Query(ge=1, le=50)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> BusquedaUsuariosRespuesta:
    return buscar_usuarios(db, q, limite, offset)


@router.patch(
    "/{usuario_id}/suspender",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)
def suspender_cuenta(
    usuario_id: UUID,
    datos: AccionReporteEntrada,
    db: Annotated[Session, Depends(get_db)],
    _administrador: Annotated[
        Usuario,
        Depends(obtener_administrador_actual)
    ]
) -> UsuarioRespuesta:
    if datos.accion != AccionModeracion.SUSPENDER_USUARIO:
        raise HTTPException(status_code=422, detail="La acción debe ser suspender_usuario")
    # Conserva la ruta histórica, pero usa exactamente las mismas validaciones,
    # cálculo UTC, protecciones y auditoría que el panel administrativo.
    from app.routers.administracion import accionar_usuario_directamente
    return accionar_usuario_directamente(usuario_id, datos, db, _administrador)


@router.delete(
    "/{usuario_id}",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)
def eliminar_cuenta(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _administrador: Annotated[
        Usuario,
        Depends(obtener_administrador_actual)
    ]
) -> UsuarioRespuesta:
    if usuario_id == _administrador.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No podés eliminar tu propia cuenta",
        )
    objetivo = db.get(Usuario, usuario_id)
    if objetivo is not None and objetivo.rol == _administrador.rol:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un administrador no puede eliminar a otro administrador",
        )
    estado_anterior = objetivo.estado.value if objetivo is not None else None
    try:
        usuario = eliminar_usuario(db, usuario_id)
        if _auditoria_disponible(db):
            registrar_auditoria(
                db,
                _administrador,
                AccionModeracion.ELIMINAR_USUARIO,
                "usuario",
                usuario.id,
                "Acción administrativa directa",
                estado_anterior,
                usuario.estado.value,
            )
            db.commit()
        return usuario
    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error


@router.get(
    "/por-nombre/{nombre_usuario}/perfil-publico",
    response_model=PerfilPublicoRespuesta
)
def consultar_perfil_publico_por_nombre(
    nombre_usuario: str,
    db: Annotated[Session, Depends(get_db)]
) -> PerfilPublicoRespuesta:
    try:
        return obtener_perfil_publico_por_nombre(db, nombre_usuario)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get("/{usuario_id}/perfil-publico", response_model=PerfilPublicoRespuesta)
def consultar_perfil_publico(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)]
) -> PerfilPublicoRespuesta:
    try:
        return obtener_perfil_publico(db, usuario_id)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.get(
    "/{usuario_id}/perfil",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK
)
def consultar_perfil(
    usuario_id: UUID,
    db: Annotated[
        Session, 
        Depends(get_db)],

    usuario_actual: Annotated[
        Usuario, 
        Depends(obtener_usuario_actual)
    ]
) -> UsuarioRespuesta:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para consultar este perfil"
        )

    try:
        return obtener_perfil(db, usuario_id)

    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error
      


@router.patch(
    "/{usuario_id}/perfil",
    response_model=UsuarioRespuesta,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verificar_csrf)]
)


def modificar_perfil(
    usuario_id: UUID,
    datos: UsuarioActualizacion,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> UsuarioRespuesta:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para actualizar este perfil"
        )

    if usuario_actual.rol == RolUsuario.ADMIN:
        campos_sociales = {"nombre", "apellido", "foto_url", "bio", "ubicacion", "generos_favoritos"}
        if datos.model_fields_set & campos_sociales:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Las cuentas administrativas no tienen perfil social",
            )

    try:
        if "generos_favoritos" in datos.model_fields_set:
            datos = datos.model_copy(
                update={
                    "generos_favoritos": normalizar_generos_favoritos(
                        datos.generos_favoritos or []
                    )
                }
            )
        return actualizar_perfil(db, usuario_id, datos)
    except UsuarioNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error)
        ) from error
    except (
        EmailDuplicadoError,
        NombreUsuarioDuplicadoError
    ) as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error)
        ) from error
    except IntegrityError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No fue posible actualizar el perfil"
        ) from error
    except GeneroFavoritoInvalidoError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error)
        ) from error
    except CatalogoNoDisponibleError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error)
        ) from error


@router.patch(
    "/{usuario_id}/password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(verificar_csrf)]
)
def modificar_password(
    usuario_id: UUID,
    datos: CambioPassword,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)]
) -> Response:
    if usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para cambiar esta contraseña"
        )

    try:
        cambiar_password(
            db,
            usuario_actual,
            datos.password_actual,
            datos.password_nueva
        )
    except PasswordActualInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error)
        ) from error

    return Response(status_code=status.HTTP_204_NO_CONTENT)
