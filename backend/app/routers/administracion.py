from datetime import date, datetime, time, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.orm import Session, aliased

from app.core.csrf import verificar_csrf
from app.core.suspension import suspension_vencida
from app.core.enums import (
    AccionModeracion,
    EstadoReporte,
    EstadoResena,
    EstadoUsuario,
    MotivoReporte,
    RolUsuario,
    TipoReporte,
)
from app.database import get_db
from app.dependencies.auth import obtener_administrador_actual
from app.models.moderacion import AuditoriaModeracion, Reporte
from app.models.resena import Resena
from app.models.usuario import Usuario
from app.schemas.moderacion import (
    AccionReporteEntrada,
    AdministradorCreacion,
    AuditoriaPagina,
    AuditoriaRespuesta,
    DenuncianteReporteRespuesta,
    ReporteActualizacion,
    ReporteAdminRespuesta,
    ReporteDetalleRespuesta,
    ReportesPagina,
    ResumenModeracion,
    UsuarioAdminResumen,
    UsuariosAdminPagina,
)
from app.schemas.usuario import UsuarioRespuesta
from app.services.moderacion_service import (
    ConflictoModeracionError,
    NoEncontradoError,
    aplicar_accion,
    crear_administrador,
    registrar_auditoria,
)


router = APIRouter(
    prefix="/admin",
    tags=["Administración"],
)


def _reporte_respuesta(db: Session, reporte: Reporte) -> ReporteAdminRespuesta:
    reportante = db.get(Usuario, reporte.reportante_id)
    objetivo = db.get(Usuario, reporte.usuario_reportado_id) if reporte.usuario_reportado_id else None
    cantidad = db.scalar(
        select(func.count()).select_from(Reporte).where(
            Reporte.objetivo_clave == reporte.objetivo_clave
        )
    ) or 0
    descartados = db.scalar(
        select(func.count()).select_from(Reporte).where(
            Reporte.reportante_id == reporte.reportante_id,
            Reporte.estado == EstadoReporte.DESCARTADO,
        )
    ) or 0
    objetivo_id = reporte.resena_reportada_id or reporte.usuario_reportado_id
    assert objetivo_id is not None
    return ReporteAdminRespuesta(
        id=reporte.id,
        tipo=reporte.tipo,
        motivo=reporte.motivo,
        descripcion=reporte.descripcion,
        contenido_snapshot=reporte.contenido_snapshot,
        estado=reporte.estado,
        reportante_id=reporte.reportante_id,
        reportante_usuario=reportante.nombre_usuario if reportante else "usuario-eliminado",
        objetivo_id=objetivo_id,
        objetivo_usuario=objetivo.nombre_usuario if objetivo else None,
        administrador_id=reporte.administrador_id,
        resolucion=reporte.resolucion,
        nota_interna=reporte.nota_interna,
        fecha_creacion=reporte.fecha_creacion,
        fecha_actualizacion=reporte.fecha_actualizacion,
        cantidad_reportes_objetivo=int(cantidad),
        reportes_descartados_reportante=int(descartados),
    )


def _auditoria_respuesta(
    db: Session, registro: AuditoriaModeracion
) -> AuditoriaRespuesta:
    admin = db.get(Usuario, registro.administrador_id)
    return AuditoriaRespuesta(
        id=registro.id,
        administrador_id=registro.administrador_id,
        administrador_usuario=(
            admin.nombre_usuario if admin else "admin-eliminado"
        ),
        accion=registro.accion,
        tipo_objetivo=registro.tipo_objetivo,
        objetivo_id=registro.objetivo_id,
        reporte_id=registro.reporte_id,
        estado_anterior=registro.estado_anterior,
        estado_nuevo=registro.estado_nuevo,
        motivo=registro.motivo,
        nota_interna=registro.nota_interna,
        suspension_inicio=registro.suspension_inicio,
        suspension_fin=registro.suspension_fin,
        fecha=registro.fecha,
    )


def _suspension_vigente(ahora: datetime):
    return (
        (Usuario.estado == EstadoUsuario.SUSPENDIDO)
        & (or_(Usuario.suspension_hasta.is_(None), Usuario.suspension_hasta > ahora))
    )


def _usuario_resumen(db: Session, usuario: Usuario) -> UsuarioAdminResumen:
    cantidad = db.scalar(select(func.count()).select_from(Reporte).where(
        Reporte.usuario_reportado_id == usuario.id
    )) or 0
    estado = usuario.estado
    if (
        estado == EstadoUsuario.SUSPENDIDO
        and usuario.suspension_hasta is not None
        and suspension_vencida(usuario.suspension_hasta)
    ):
        estado = EstadoUsuario.ACTIVO
    return UsuarioAdminResumen(
        id=usuario.id, nombre=usuario.nombre, apellido=usuario.apellido,
        nombre_usuario=usuario.nombre_usuario, email=usuario.email,
        rol=usuario.rol.value, estado=estado.value,
        es_admin_principal=usuario.es_admin_principal,
        suspension_hasta=usuario.suspension_hasta,
        motivo_suspension=usuario.motivo_suspension,
        ocultar_contenido=usuario.ocultar_contenido,
        cantidad_reportes=int(cantidad),
    )


@router.get("/resumen", response_model=ResumenModeracion)
def obtener_resumen(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> ResumenModeracion:
    conteos = dict(
        db.execute(
            select(Reporte.estado, func.count()).group_by(Reporte.estado)
        ).all()
    )
    ahora = datetime.now(timezone.utc)
    suspendidos = db.scalar(
        select(func.count()).select_from(Usuario).where(
            Usuario.rol == RolUsuario.USUARIO,
            _suspension_vigente(ahora),
        )
    ) or 0
    return ResumenModeracion(
        pendientes=conteos.get(EstadoReporte.PENDIENTE, 0),
        en_revision=conteos.get(EstadoReporte.EN_REVISION, 0),
        resueltos=conteos.get(EstadoReporte.RESUELTO, 0),
        descartados=conteos.get(EstadoReporte.DESCARTADO, 0),
        usuarios_suspendidos=int(suspendidos),
    )


@router.get("/reportes", response_model=ReportesPagina)
def listar_reportes(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
    tipo: TipoReporte | None = None,
    estado: EstadoReporte | None = None,
    motivo: MotivoReporte | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    buscar: str | None = Query(default=None, max_length=100),
    cantidad_minima: int | None = Query(default=None, ge=1),
    orden: str = Query(default="recientes", pattern="^(recientes|antiguos|mas_reportados)$"),
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
) -> ReportesPagina:
    consulta = select(Reporte)
    condiciones = []
    otro_reporte = aliased(Reporte)
    cantidad_objetivo = (
        select(func.count())
        .select_from(otro_reporte)
        .where(otro_reporte.objetivo_clave == Reporte.objetivo_clave)
        .correlate(Reporte)
        .scalar_subquery()
    )
    if tipo:
        condiciones.append(Reporte.tipo == tipo)
    if estado:
        condiciones.append(Reporte.estado == estado)
    if motivo:
        condiciones.append(Reporte.motivo == motivo)
    if desde:
        condiciones.append(
            Reporte.fecha_creacion >= datetime.combine(desde, time.min, timezone.utc)
        )
    if hasta:
        condiciones.append(
            Reporte.fecha_creacion <= datetime.combine(hasta, time.max, timezone.utc)
        )
    if buscar:
        patron = f"%{buscar.strip().lower()}%"
        usuarios = select(Usuario.id).where(
            or_(
                func.lower(Usuario.nombre_usuario).like(patron),
                func.lower(Usuario.nombre).like(patron),
                func.lower(Usuario.apellido).like(patron),
            )
        )
        condiciones.append(
            or_(
                Reporte.reportante_id.in_(usuarios),
                Reporte.usuario_reportado_id.in_(usuarios),
                func.lower(Reporte.contenido_snapshot).like(patron),
            )
        )
    if cantidad_minima:
        condiciones.append(cantidad_objetivo >= cantidad_minima)
    if condiciones:
        consulta = consulta.where(*condiciones)
    total = db.scalar(select(func.count()).select_from(consulta.subquery())) or 0
    if orden == "antiguos":
        consulta = consulta.order_by(Reporte.fecha_creacion.asc())
    elif orden == "mas_reportados":
        consulta = consulta.order_by(
            cantidad_objetivo.desc(), Reporte.fecha_creacion.desc()
        )
    else:
        consulta = consulta.order_by(Reporte.fecha_creacion.desc())
    reportes = db.scalars(
        consulta.offset((pagina - 1) * por_pagina).limit(por_pagina)
    ).all()
    return ReportesPagina(
        items=[_reporte_respuesta(db, reporte) for reporte in reportes],
        total=int(total), pagina=pagina, por_pagina=por_pagina,
    )


@router.get(
    "/reportes/{reporte_id}/detalle",
    response_model=ReporteDetalleRespuesta,
)
def obtener_detalle_reporte(
    reporte_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> ReporteDetalleRespuesta:
    reporte = db.get(Reporte, reporte_id)
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    relacionados = db.scalars(
        select(Reporte)
        .where(Reporte.objetivo_clave == reporte.objetivo_clave)
        .order_by(Reporte.fecha_creacion.desc())
    ).all()
    denunciantes = []
    for relacionado in relacionados:
        reportante = db.get(Usuario, relacionado.reportante_id)
        denunciantes.append(
            DenuncianteReporteRespuesta(
                id=relacionado.reportante_id,
                usuario=(
                    reportante.nombre_usuario
                    if reportante
                    else "usuario-eliminado"
                ),
                motivo=relacionado.motivo,
                descripcion=relacionado.descripcion,
                fecha=relacionado.fecha_creacion,
            )
        )

    objetivo_ids = {
        identificador
        for identificador in (
            reporte.resena_reportada_id,
            reporte.usuario_reportado_id,
        )
        if identificador is not None
    }
    ids_reportes = [relacionado.id for relacionado in relacionados]
    historial = db.scalars(
        select(AuditoriaModeracion)
        .where(
            or_(
                AuditoriaModeracion.reporte_id.in_(ids_reportes),
                AuditoriaModeracion.objetivo_id.in_(objetivo_ids),
            )
        )
        .order_by(AuditoriaModeracion.fecha.desc())
    ).all()

    usuario_objetivo = (
        db.get(Usuario, reporte.usuario_reportado_id)
        if reporte.usuario_reportado_id
        else None
    )
    resena_objetivo = (
        db.get(Resena, reporte.resena_reportada_id)
        if reporte.resena_reportada_id
        else None
    )
    base = _reporte_respuesta(db, reporte)
    return ReporteDetalleRespuesta(
        **base.model_dump(),
        denunciantes=denunciantes,
        historial=[_auditoria_respuesta(db, registro) for registro in historial],
        estado_objetivo_usuario=(
            usuario_objetivo.estado if usuario_objetivo else None
        ),
        estado_contenido=(resena_objetivo.estado if resena_objetivo else None),
        objetivo_nombre=(usuario_objetivo.nombre if usuario_objetivo else None),
        objetivo_apellido=(usuario_objetivo.apellido if usuario_objetivo else None),
        objetivo_usuario_id=(usuario_objetivo.id if usuario_objetivo else None),
    )


@router.patch(
    "/reportes/{reporte_id}",
    response_model=ReporteAdminRespuesta,
    dependencies=[Depends(verificar_csrf)],
)
def actualizar_reporte(
    reporte_id: UUID,
    datos: ReporteActualizacion,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> ReporteAdminRespuesta:
    reporte = db.get(Reporte, reporte_id)
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    anterior = reporte.estado.value
    reporte.estado = datos.estado
    reporte.administrador_id = admin.id
    reporte.resolucion = datos.resolucion
    reporte.nota_interna = datos.nota_interna
    reporte.fecha_actualizacion = datetime.now(timezone.utc)
    registrar_auditoria(
        db, admin, AccionModeracion.ACTUALIZAR_REPORTE, "reporte", reporte.id,
        datos.resolucion or f"Reporte marcado como {datos.estado.value}",
        anterior, datos.estado.value, reporte.id, datos.nota_interna,
    )
    db.commit()
    db.refresh(reporte)
    return _reporte_respuesta(db, reporte)


@router.post(
    "/reportes/{reporte_id}/accion",
    response_model=ReporteAdminRespuesta,
    dependencies=[Depends(verificar_csrf)],
)
def ejecutar_accion(
    reporte_id: UUID,
    datos: AccionReporteEntrada,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> ReporteAdminRespuesta:
    reporte = db.get(Reporte, reporte_id)
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    try:
        aplicar_accion(db, reporte, admin, datos)
    except NoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ConflictoModeracionError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    db.refresh(reporte)
    return _reporte_respuesta(db, reporte)


@router.get("/auditoria", response_model=AuditoriaPagina)
def listar_auditoria(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
) -> AuditoriaPagina:
    total = db.scalar(select(func.count()).select_from(AuditoriaModeracion)) or 0
    registros = db.scalars(
        select(AuditoriaModeracion)
        .order_by(AuditoriaModeracion.fecha.desc())
        .offset((pagina - 1) * por_pagina)
        .limit(por_pagina)
    ).all()
    items = [_auditoria_respuesta(db, registro) for registro in registros]
    return AuditoriaPagina(items=items, total=int(total), pagina=pagina, por_pagina=por_pagina)


@router.get("/usuarios", response_model=UsuariosAdminPagina)
def listar_usuarios(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
    buscar: str | None = Query(default=None, max_length=100),
    estado: str = Query(default="todos", pattern="^(todos|activos|suspendidos)$"),
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=20, ge=1, le=100),
) -> UsuariosAdminPagina:
    ahora = datetime.now(timezone.utc)
    consulta = select(Usuario).where(Usuario.rol == RolUsuario.USUARIO)
    if estado == "suspendidos":
        consulta = consulta.where(_suspension_vigente(ahora))
    elif estado == "activos":
        consulta = consulta.where(or_(
            Usuario.estado == EstadoUsuario.ACTIVO,
            (Usuario.estado == EstadoUsuario.SUSPENDIDO)
            & Usuario.suspension_hasta.is_not(None)
            & (Usuario.suspension_hasta <= ahora),
        ))
    if buscar:
        patron = f"%{buscar.strip().lower()}%"
        consulta = consulta.where(or_(
            func.lower(Usuario.nombre_usuario).like(patron),
            func.lower(Usuario.email).like(patron),
            func.lower(Usuario.nombre).like(patron),
            func.lower(Usuario.apellido).like(patron),
        ))
    total = db.scalar(select(func.count()).select_from(consulta.subquery())) or 0
    usuarios = db.scalars(
        consulta.order_by(Usuario.fecha_registro.desc())
        .offset((pagina - 1) * por_pagina).limit(por_pagina)
    ).all()
    items = [_usuario_resumen(db, usuario) for usuario in usuarios]
    return UsuariosAdminPagina(items=items, total=int(total), pagina=pagina, por_pagina=por_pagina)


@router.get("/administradores", response_model=UsuariosAdminPagina)
def listar_administradores(
    db: Annotated[Session, Depends(get_db)],
    principal: Annotated[Usuario, Depends(obtener_administrador_actual)],
    pagina: int = Query(default=1, ge=1),
    por_pagina: int = Query(default=50, ge=1, le=100),
) -> UsuariosAdminPagina:
    if not principal.es_admin_principal:
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede consultar administradores")
    consulta = select(Usuario).where(Usuario.rol == RolUsuario.ADMIN)
    total = db.scalar(select(func.count()).select_from(consulta.subquery())) or 0
    usuarios = db.scalars(
        consulta.order_by(Usuario.es_admin_principal.desc(), Usuario.fecha_registro.asc())
        .offset((pagina - 1) * por_pagina).limit(por_pagina)
    ).all()
    return UsuariosAdminPagina(
        items=[_usuario_resumen(db, usuario) for usuario in usuarios],
        total=int(total), pagina=pagina, por_pagina=por_pagina,
    )


@router.post(
    "/administradores",
    response_model=UsuarioRespuesta,
    status_code=201,
    dependencies=[Depends(verificar_csrf)],
)
def alta_administrador(
    datos: AdministradorCreacion,
    db: Annotated[Session, Depends(get_db)],
    principal: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> UsuarioRespuesta:
    try:
        return crear_administrador(db, principal, datos)
    except ConflictoModeracionError as error:
        raise HTTPException(status_code=403 if "principal" in str(error) else 409, detail=str(error)) from error


@router.delete(
    "/administradores/{usuario_id}",
    response_model=UsuarioRespuesta,
    dependencies=[Depends(verificar_csrf)],
)
def revocar_administrador(
    usuario_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    principal: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> UsuarioRespuesta:
    if not principal.es_admin_principal:
        raise HTTPException(status_code=403, detail="Solo el administrador principal puede quitar administradores")
    if usuario_id == principal.id:
        raise HTTPException(status_code=409, detail="No podés quitarte tu propio rol")
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.rol != RolUsuario.ADMIN:
        raise HTTPException(status_code=409, detail="El usuario no es administrador")
    usuario.rol = RolUsuario.USUARIO
    registrar_auditoria(
        db, principal, AccionModeracion.REVOCAR_ADMIN, "usuario", usuario.id,
        "Revocación de administrador", RolUsuario.ADMIN.value, RolUsuario.USUARIO.value,
    )
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post(
    "/usuarios/{usuario_id}/accion",
    response_model=UsuarioRespuesta,
    dependencies=[Depends(verificar_csrf)],
)
def accionar_usuario_directamente(
    usuario_id: UUID,
    datos: AccionReporteEntrada,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[Usuario, Depends(obtener_administrador_actual)],
) -> UsuarioRespuesta:
    permitidas = {
        AccionModeracion.SUSPENDER_USUARIO,
        AccionModeracion.REACTIVAR_USUARIO,
        AccionModeracion.ELIMINAR_USUARIO,
    }
    if datos.accion not in permitidas:
        raise HTTPException(status_code=422, detail="Acción de usuario inválida")
    usuario = db.get(Usuario, usuario_id)
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.id == admin.id:
        raise HTTPException(status_code=409, detail="No podés moderar tu propia cuenta")
    if usuario.rol == RolUsuario.ADMIN:
        raise HTTPException(status_code=409, detail="No se puede moderar otra cuenta administrativa")

    anterior = usuario.estado.value
    suspension_inicio = None
    suspension_fin = None
    if datos.accion == AccionModeracion.SUSPENDER_USUARIO:
        if usuario.estado == EstadoUsuario.ELIMINADO:
            raise HTTPException(status_code=409, detail="No se puede suspender una cuenta eliminada")
        suspension_inicio = datetime.now(timezone.utc)
        if datos.tipo_suspension == "temporal":
            cantidad = datos.duracion_suspension or 0
            delta = timedelta(hours=cantidad) if datos.unidad_suspension == "horas" else timedelta(days=cantidad)
            suspension_fin = suspension_inicio + delta
        usuario.estado = EstadoUsuario.SUSPENDIDO
        usuario.suspension_hasta = suspension_fin
        usuario.motivo_suspension = datos.motivo
        usuario.ocultar_contenido = datos.ocultar_contenido
    elif datos.accion == AccionModeracion.REACTIVAR_USUARIO:
        usuario.estado = EstadoUsuario.ACTIVO
        usuario.suspension_hasta = None
        usuario.motivo_suspension = None
        usuario.ocultar_contenido = False
    else:
        usuario.estado = EstadoUsuario.ELIMINADO
        usuario.suspension_hasta = None
        usuario.motivo_suspension = datos.motivo
        usuario.ocultar_contenido = True
    registrar_auditoria(
        db, admin, datos.accion, "usuario", usuario.id, datos.motivo,
        anterior, usuario.estado.value, nota=datos.nota_interna,
        suspension_inicio=suspension_inicio, suspension_fin=suspension_fin,
    )
    if datos.accion in {
        AccionModeracion.SUSPENDER_USUARIO,
        AccionModeracion.ELIMINAR_USUARIO,
    }:
        db.execute(
            update(Reporte)
            .where(
                Reporte.usuario_reportado_id == usuario.id,
                Reporte.estado.in_([
                    EstadoReporte.PENDIENTE,
                    EstadoReporte.EN_REVISION,
                ]),
            )
            .values(
                estado=EstadoReporte.RESUELTO,
                administrador_id=admin.id,
                resolucion=datos.motivo,
                nota_interna=datos.nota_interna,
                fecha_actualizacion=datetime.now(timezone.utc),
            )
        )
    db.commit()
    db.refresh(usuario)
    return usuario
