from datetime import datetime, timezone
from functools import lru_cache
from typing import Any
from uuid import UUID, uuid4

import httpx
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import EstadoResena, EstadoUsuario
from app.core.tmdb import consultar_tmdb
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena, ValoracionResena
from app.models.usuario import Usuario
from app.schemas.contenido import (
    AutorResena,
    CalificacionActualizacion,
    CalificacionActualizadaRespuesta,
    CalificacionPropiaRespuesta,
    ContenidoDetalleRespuesta,
    GeneroContenido,
    ResenaCreacion,
    ResenaCreadaRespuesta,
    ResenaContenidoRespuesta,
    TipoContenido,
)


class ContenidoNoEncontradoError(Exception):
    pass


class CatalogoNoDisponibleError(Exception):
    pass


class ResenaPadreNoEncontradaError(Exception):
    pass


class CalificacionDuplicadaError(Exception):
    pass


class ResenaPadreInvalidaError(Exception):
    pass


class CalificacionNoEncontradaError(Exception):
    pass


class GeneroFavoritoInvalidoError(Exception):
    pass


RUTA_TMDB = {"pelicula": "movie", "serie": "tv"}


def obtener_calificaciones_propias(
    db: Session, tipo: TipoContenido, tmdb_id: int, usuario_id: UUID,
) -> list[CalificacionPropiaRespuesta]:
    filas = db.execute(
        select(CalificacionResena.resena_id, CalificacionResena.calificacion)
        .join(Resena, Resena.id == CalificacionResena.resena_id)
        .join(Contenido, Contenido.id == Resena.contenido_id)
        .where(
            CalificacionResena.usuario_id == usuario_id,
            Resena.resena_padre_id.is_(None),
            Contenido.tipo == tipo,
            Contenido.tmdb_id == tmdb_id,
        )
    ).all()
    return [
        CalificacionPropiaRespuesta(resena_id=resena_id, calificacion=float(puntaje))
        for resena_id, puntaje in filas
    ]


def actualizar_calificacion(
    db: Session, tipo: TipoContenido, tmdb_id: int, resena_id: UUID,
    usuario_id: UUID, datos: CalificacionActualizacion,
) -> CalificacionActualizadaRespuesta:
    padre = db.scalar(
        select(Resena)
        .join(Contenido, Contenido.id == Resena.contenido_id)
        .where(
            Resena.id == resena_id, Resena.resena_padre_id.is_(None),
            Contenido.tipo == tipo, Contenido.tmdb_id == tmdb_id,
        )
    )
    if padre is None:
        raise ResenaPadreNoEncontradaError("Reseña padre no encontrada")

    # La identidad viene de la sesión, nunca de un usuario enviado por el cliente.
    valoracion = db.get(CalificacionResena, (usuario_id, resena_id))
    if valoracion is None:
        raise CalificacionNoEncontradaError("No tenés una valoración para editar en esta reseña")

    try:
        valoracion.calificacion = datos.calificacion
        valoracion.fecha_actualizacion = datetime.now(timezone.utc)
        db.flush()
        promedio, cantidad = db.execute(
            select(func.avg(CalificacionResena.calificacion), func.count())
            .where(CalificacionResena.resena_id == resena_id)
        ).one()
        respuesta = CalificacionActualizadaRespuesta(
            resena_id=resena_id, calificacion=float(valoracion.calificacion),
            promedio_comunitario=float(promedio), cantidad_valoraciones=cantidad,
        )
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
    return respuesta


@lru_cache(maxsize=1)
def obtener_generos_contenido() -> tuple[GeneroContenido, ...]:
    """Devuelve la unión de géneros oficiales de películas y series de TMDB.

    La lista cambia con muy poca frecuencia, por lo que se conserva durante la
    vida del proceso para no consultar dos veces a TMDB en cada formulario.
    """
    generos_por_id: dict[int, GeneroContenido] = {}

    for ruta in ("movie", "tv"):
        for genero in _consultar_lista_generos_tmdb(ruta):
            identificador = int(genero["id"])
            generos_por_id.setdefault(
                identificador,
                GeneroContenido(id=identificador, nombre=genero["name"]),
            )

    return tuple(
        sorted(generos_por_id.values(), key=lambda genero: genero.nombre.casefold())
    )


def normalizar_generos_favoritos(generos: list[str]) -> list[str]:
    """Valida nombres enviados por el cliente y devuelve los nombres de TMDB."""
    disponibles = {
        genero.nombre.casefold(): genero.nombre
        for genero in obtener_generos_contenido()
    }
    invalidos = [genero for genero in generos if genero.casefold() not in disponibles]
    if invalidos:
        raise GeneroFavoritoInvalidoError(
            f"Género favorito inexistente: {', '.join(invalidos)}"
        )

    return [disponibles[genero.casefold()] for genero in generos]


def obtener_detalle_contenido(
    tipo: TipoContenido,
    tmdb_id: int,
) -> ContenidoDetalleRespuesta:
    datos = _consultar_tmdb(RUTA_TMDB[tipo], tmdb_id)
    es_pelicula = tipo == "pelicula"

    return ContenidoDetalleRespuesta(
        tmdb_id=datos["id"],
        tipo=tipo,
        titulo=datos.get("title" if es_pelicula else "name") or "Sin título",
        titulo_original=(
            datos.get("original_title" if es_pelicula else "original_name")
            or datos.get("title" if es_pelicula else "name")
            or "Sin título"
        ),
        sinopsis=datos.get("overview") or "",
        fecha_estreno=datos.get(
            "release_date" if es_pelicula else "first_air_date"
        ) or None,
        poster_url=_url_imagen(datos.get("poster_path"), "w500"),
        portada_url=_url_imagen(datos.get("backdrop_path"), "original"),
        generos=[
            GeneroContenido(id=genero["id"], nombre=genero["name"])
            for genero in datos.get("genres", [])
        ],
        duracion_minutos=(
            datos.get("runtime")
            if es_pelicula
            else _duracion_episodio(datos.get("episode_run_time"))
        ),
        cantidad_temporadas=(None if es_pelicula else datos.get("number_of_seasons")),
        calificacion_tmdb=float(datos.get("vote_average") or 0),
    )


def obtener_resenas_contenido(
    db: Session,
    tipo: TipoContenido,
    tmdb_id: int,
) -> list[ResenaContenidoRespuesta]:
    valoraciones = (
        select(
            ValoracionResena.resena_id,
            func.sum(ValoracionResena.valor).label("valoracion"),
        )
        .group_by(ValoracionResena.resena_id)
        .subquery()
    )

    # La tabla comunitaria contiene una puntuación vigente por usuario y padre.
    # AVG conserva NULL cuando no hay estrellas; solo el contador pasa a cero.
    calificaciones = (
        select(
            CalificacionResena.resena_id,
            func.avg(CalificacionResena.calificacion).label("promedio"),
            func.count(CalificacionResena.calificacion).label("cantidad"),
        )
        .group_by(CalificacionResena.resena_id)
        .subquery()
    )

    filas = db.execute(
        select(
            Resena,
            Usuario,
            func.coalesce(valoraciones.c.valoracion, 0),
            calificaciones.c.promedio,
            func.coalesce(calificaciones.c.cantidad, 0),
        )
        .join(Usuario, Usuario.id == Resena.usuario_id)
        .join(Contenido, Contenido.id == Resena.contenido_id)
        .outerjoin(valoraciones, valoraciones.c.resena_id == Resena.id)
        .outerjoin(calificaciones, calificaciones.c.resena_id == Resena.id)
        .where(
            Contenido.tmdb_id == tmdb_id,
            Contenido.tipo == tipo,
            Resena.estado == EstadoResena.VISIBLE,
            or_(
                Usuario.estado == EstadoUsuario.ACTIVO,
                Usuario.ocultar_contenido.is_(False),
            ),
        )
        .order_by(Resena.fecha.desc(), Resena.id.desc())
    ).all()

    return [
        ResenaContenidoRespuesta(
            id=resena.id,
            contenido_tmdb_id=resena.contenido_tmdb_id,
            resena_padre_id=resena.resena_padre_id,
            plataforma_id=resena.plataforma_id,
            calificacion=(
                float(resena.calificacion) if resena.calificacion is not None else None
            ),
            texto=resena.texto,
            fecha=resena.fecha,
            valoracion=int(valoracion),
            promedio_comunitario=float(promedio) if promedio is not None else None,
            cantidad_valoraciones=int(cantidad),
            autor=AutorResena.model_validate(usuario, from_attributes=True),
        )
        for resena, usuario, valoracion, promedio, cantidad in filas
    ]


def crear_resena(
    db: Session,
    tipo: TipoContenido,
    tmdb_id: int,
    usuario_id: UUID,
    datos: ResenaCreacion,
) -> ResenaCreadaRespuesta:
    contenido = db.scalar(
        select(Contenido).where(
            Contenido.tmdb_id == tmdb_id,
            Contenido.tipo == tipo,
        )
    )
    if contenido is None:
        # Solo la primera reseña necesita incorporar el contenido desde TMDB.
        # Responder o valorar contenido existente no depende de la red externa.
        detalle = obtener_detalle_contenido(tipo, tmdb_id)
        contenido = Contenido(
            tmdb_id=tmdb_id,
            tipo=tipo,
            temporada=None,
            episodio=None,
            titulo=detalle.titulo,
        )
        db.add(contenido)
        db.flush()

    if datos.resena_padre_id is not None:
        padre = db.get(Resena, datos.resena_padre_id)
        if padre is None:
            raise ResenaPadreNoEncontradaError("Reseña padre no encontrada")
        if padre.contenido_id != contenido.id:
            raise ResenaPadreInvalidaError(
                "La reseña padre no pertenece al contenido indicado"
            )

    if datos.resena_padre_id is None:
        if datos.calificacion is None:
            raise ValueError("La reseña original requiere una calificación")
    elif datos.calificacion is not None:
        if padre.resena_padre_id is not None:
            raise ValueError("Las respuestas a comentarios no admiten estrellas")
        if padre.usuario_id == usuario_id:
            raise ValueError("No se puede valorar una reseña propia")
        if datos.calificacion < 0.5 or datos.calificacion * 2 % 1 != 0:
            raise ValueError("La calificación debe ser de 0.5 a 5 en pasos de 0.5")
        if db.get(CalificacionResena, (usuario_id, padre.id)) is not None:
            raise CalificacionDuplicadaError("Ya valoraste esta reseña")

    texto = datos.texto.strip()
    if not texto:
        raise ValueError("El texto de la reseña no puede estar vacío")

    resena = Resena(
        id=uuid4(),
        usuario_id=usuario_id,
        contenido_id=contenido.id,
        resena_padre_id=datos.resena_padre_id,
        plataforma_id=datos.plataforma_id,
        calificacion=datos.calificacion,
        texto=texto,
        fecha=datetime.now(timezone.utc),
    )
    db.add(resena)
    if datos.resena_padre_id is not None and datos.calificacion is not None:
        calificacion = CalificacionResena(
            usuario_id=usuario_id,
            resena_id=padre.id,
            calificacion=datos.calificacion,
            fecha_actualizacion=resena.fecha,
        )
        # Insertar primero la valoración: la PK resuelve también la carrera
        # entre solicitudes que superaron simultáneamente la consulta previa.
        db.add(calificacion)
        try:
            db.flush([calificacion])
        except IntegrityError as error:
            db.rollback()
            if db.get(CalificacionResena, (usuario_id, padre.id)) is not None:
                raise CalificacionDuplicadaError("Ya valoraste esta reseña") from error
            raise
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(resena)

    return ResenaCreadaRespuesta(
        mensaje="Reseña publicada correctamente",
        id=resena.id,
        usuario_id=resena.usuario_id,
        contenido_tmdb_id=resena.contenido_tmdb_id,
        resena_padre_id=resena.resena_padre_id,
        plataforma_id=resena.plataforma_id,
        calificacion=float(resena.calificacion) if resena.calificacion is not None else None,
        texto=resena.texto,
        fecha=resena.fecha,
    )


def _consultar_tmdb(ruta: str, tmdb_id: int) -> dict[str, Any]:
    return _consultar_ruta_tmdb(f"{ruta}/{tmdb_id}", contenido=True)


def _consultar_lista_generos_tmdb(ruta: str) -> list[dict[str, Any]]:
    datos = _consultar_ruta_tmdb(f"genre/{ruta}/list")
    return datos.get("genres", [])


def _consultar_ruta_tmdb(
    ruta: str,
    *,
    contenido: bool = False,
) -> dict[str, Any]:
    if not settings.tmdb_access_token:
        raise CatalogoNoDisponibleError("El catálogo no está configurado")

    try:
        respuesta = consultar_tmdb(
            f"{settings.tmdb_api_url}/{ruta}",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {settings.tmdb_access_token}",
            },
            params={"language": "es-MX"},
        )
    except httpx.HTTPStatusError as error:
        if contenido and error.response.status_code == 404:
            raise ContenidoNoEncontradoError("Contenido no encontrado") from error
        raise CatalogoNoDisponibleError("No fue posible consultar el catálogo") from error
    except httpx.RequestError as error:
        raise CatalogoNoDisponibleError(
            "No fue posible consultar el catálogo"
        ) from error

    return respuesta.json()


def _url_imagen(ruta: str | None, tamano: str) -> str | None:
    if not ruta:
        return None
    return f"{settings.tmdb_image_url}/{tamano}{ruta}"


def _duracion_episodio(duraciones: list[int] | None) -> int | None:
    return duraciones[0] if duraciones else None
