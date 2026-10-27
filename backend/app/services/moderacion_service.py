import json
from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import (
    AccionModeracion,
    EstadoReporte,
    EstadoResena,
    EstadoUsuario,
    RolUsuario,
    TipoReporte,
)
from app.models.moderacion import AuditoriaModeracion, Reporte
from app.models.resena import Resena
from app.models.usuario import Usuario
from app.schemas.moderacion import (
    AccionReporteEntrada,
    AdministradorCreacion,
    ReporteCreacion,
)
from app.core.security import generar_hash_password


class ModeracionError(Exception):
    pass


class NoEncontradoError(ModeracionError):
    pass


class ConflictoModeracionError(ModeracionError):
    pass


class LimiteReportesError(ModeracionError):
    pass


def crear_reporte(db: Session, reportante: Usuario, datos: ReporteCreacion) -> Reporte:
    desde = datetime.now(timezone.utc) - timedelta(hours=24)
    cantidad = db.scalar(
        select(func.count()).select_from(Reporte).where(
            Reporte.reportante_id == reportante.id,
            Reporte.fecha_creacion >= desde,
        )
    ) or 0
    if cantidad >= settings.limite_reportes_diarios:
        raise LimiteReportesError("Alcanzaste el límite diario de reportes")

    objetivo_clave = f"{datos.tipo.value}:{datos.objetivo_id}"
    usuario_reportado_id = None
    resena_reportada_id = None

    if datos.tipo == TipoReporte.USUARIO:
        usuario = db.get(Usuario, datos.objetivo_id)
        if usuario is None or usuario.estado != EstadoUsuario.ACTIVO:
            raise NoEncontradoError("El usuario no existe o ya no está visible")
        if usuario.id == reportante.id:
            raise ConflictoModeracionError("No podés reportarte a vos mismo")
        usuario_reportado_id = usuario.id
        snapshot = {
            "id": str(usuario.id),
            "nombre_usuario": usuario.nombre_usuario,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
        }
    else:
        resena = db.get(Resena, datos.objetivo_id)
        if resena is None or resena.estado != EstadoResena.VISIBLE:
            raise NoEncontradoError("El comentario no existe o ya no está visible")
        if resena.usuario_id == reportante.id:
            raise ConflictoModeracionError("No podés reportar tu propio comentario")
        autor = db.get(Usuario, resena.usuario_id)
        if autor is None:
            raise NoEncontradoError("El autor del comentario no existe")
        resena_reportada_id = resena.id
        usuario_reportado_id = autor.id
        snapshot = {
            "id": str(resena.id),
            "texto": resena.texto,
            "autor_id": str(autor.id),
            "autor_usuario": autor.nombre_usuario,
            "fecha": resena.fecha.isoformat(),
            "contenido_tmdb_id": str(resena.contenido_tmdb_id),
            "contenido_tipo": resena.contenido.tipo,
        }

    ahora = datetime.now(timezone.utc)
    reporte = Reporte(
        id=uuid4(),
        reportante_id=reportante.id,
        tipo=datos.tipo,
        objetivo_clave=objetivo_clave,
        usuario_reportado_id=usuario_reportado_id,
        resena_reportada_id=resena_reportada_id,
        motivo=datos.motivo,
        descripcion=datos.descripcion.strip() if datos.descripcion else None,
        contenido_snapshot=json.dumps(snapshot, ensure_ascii=False),
        estado=EstadoReporte.PENDIENTE,
        fecha_creacion=ahora,
        fecha_actualizacion=ahora,
    )
    db.add(reporte)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise ConflictoModeracionError("Ya reportaste este elemento") from error
    db.refresh(reporte)
    return reporte


def registrar_auditoria(
    db: Session,
    admin: Usuario,
    accion: AccionModeracion,
    tipo_objetivo: str,
    objetivo_id: UUID,
    motivo: str,
    anterior: str | None,
    nuevo: str | None,
    reporte_id: UUID | None = None,
    nota: str | None = None,
) -> AuditoriaModeracion:
    auditoria = AuditoriaModeracion(
        id=uuid4(),
        administrador_id=admin.id,
        accion=accion,
        tipo_objetivo=tipo_objetivo,
        objetivo_id=objetivo_id,
        reporte_id=reporte_id,
        estado_anterior=anterior,
        estado_nuevo=nuevo,
        motivo=motivo,
        nota_interna=nota,
        fecha=datetime.now(timezone.utc),
    )
    db.add(auditoria)
    return auditoria


def aplicar_accion(
    db: Session,
    reporte: Reporte,
    admin: Usuario,
    datos: AccionReporteEntrada,
) -> None:
    acciones_comentario = {
        AccionModeracion.OCULTAR_COMENTARIO: EstadoResena.OCULTA,
        AccionModeracion.RESTAURAR_COMENTARIO: EstadoResena.VISIBLE,
        AccionModeracion.ELIMINAR_COMENTARIO: EstadoResena.ELIMINADA,
    }
    if datos.accion in acciones_comentario:
        if reporte.resena_reportada_id is None:
            raise ConflictoModeracionError("La acción no corresponde a este reporte")
        resena = db.get(Resena, reporte.resena_reportada_id)
        if resena is None:
            raise NoEncontradoError("Comentario no encontrado")
        anterior = resena.estado.value
        resena.estado = acciones_comentario[datos.accion]
        registrar_auditoria(
            db, admin, datos.accion, "comentario", resena.id, datos.motivo,
            anterior, resena.estado.value, reporte.id, datos.nota_interna,
        )
    elif datos.accion in {
        AccionModeracion.SUSPENDER_USUARIO,
        AccionModeracion.REACTIVAR_USUARIO,
        AccionModeracion.ELIMINAR_USUARIO,
    }:
        if reporte.usuario_reportado_id is None:
            raise ConflictoModeracionError("La acción no corresponde a este reporte")
        usuario = db.get(Usuario, reporte.usuario_reportado_id)
        if usuario is None:
            raise NoEncontradoError("Usuario no encontrado")
        if usuario.id == admin.id:
            raise ConflictoModeracionError("No podés moderar tu propia cuenta")
        if usuario.rol == RolUsuario.ADMIN:
            raise ConflictoModeracionError("Un administrador no puede moderar a otro administrador")
        anterior = usuario.estado.value
        if datos.accion == AccionModeracion.SUSPENDER_USUARIO:
            usuario.estado = EstadoUsuario.SUSPENDIDO
            usuario.suspension_hasta = (
                datetime.now(timezone.utc) + timedelta(hours=datos.horas_suspension)
                if datos.horas_suspension else None
            )
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
            anterior, usuario.estado.value, reporte.id, datos.nota_interna,
        )
    else:
        raise ConflictoModeracionError("Acción no permitida para un reporte")

    ahora = datetime.now(timezone.utc)
    db.execute(
        update(Reporte)
        .where(
            Reporte.objetivo_clave == reporte.objetivo_clave,
            Reporte.estado.in_([EstadoReporte.PENDIENTE, EstadoReporte.EN_REVISION]),
        )
        .values(
            estado=EstadoReporte.RESUELTO,
            administrador_id=admin.id,
            resolucion=datos.motivo,
            nota_interna=datos.nota_interna,
            fecha_actualizacion=ahora,
        )
    )
    db.commit()


def crear_administrador(
    db: Session, principal: Usuario, datos: AdministradorCreacion
) -> Usuario:
    if not principal.es_admin_principal:
        raise ConflictoModeracionError(
            "Solo el administrador principal puede crear administradores"
        )
    email = str(datos.email).lower()
    nombre_usuario = datos.nombre_usuario.lower()
    existente = db.scalar(
        select(Usuario).where(
            or_(func.lower(Usuario.email) == email,
                func.lower(Usuario.nombre_usuario) == nombre_usuario)
        )
    )
    if existente is not None:
        raise ConflictoModeracionError("El email o nombre de usuario ya está registrado")
    usuario = Usuario(
        id=uuid4(),
        nombre=datos.nombre.strip(),
        apellido=datos.apellido.strip(),
        nombre_usuario=nombre_usuario,
        email=email,
        password_hash=generar_hash_password(datos.password),
        rol=RolUsuario.ADMIN,
        estado=EstadoUsuario.ACTIVO,
        es_admin_principal=False,
        ocultar_contenido=False,
        fecha_registro=datetime.now(timezone.utc),
    )
    db.add(usuario)
    registrar_auditoria(
        db, principal, AccionModeracion.CREAR_ADMIN, "usuario", usuario.id,
        "Alta de administrador", RolUsuario.USUARIO.value, RolUsuario.ADMIN.value,
    )
    db.commit()
    db.refresh(usuario)
    return usuario
