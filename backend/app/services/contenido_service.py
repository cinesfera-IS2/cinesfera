from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.contenido import Contenido
from app.models.resena import Resena, ValoracionResena
from app.models.usuario import Usuario
from app.schemas.contenido import (
    AutorResena,
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


class ResenaPadreInvalidaError(Exception):
    pass


RUTA_TMDB = {"pelicula": "movie", "serie": "tv"}


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

    filas = db.execute(
        select(
            Resena,
            Usuario,
            func.coalesce(valoraciones.c.valoracion, 0),
        )
        .join(Usuario, Usuario.id == Resena.usuario_id)
        .join(Contenido, Contenido.id == Resena.contenido_id)
        .outerjoin(valoraciones, valoraciones.c.resena_id == Resena.id)
        .where(Contenido.tmdb_id == tmdb_id, Contenido.tipo == tipo)
        .order_by(Resena.fecha.desc(), Resena.id.desc())
    ).all()

    return [
        ResenaContenidoRespuesta(
            id=resena.id,
            contenido_tmdb_id=resena.contenido_tmdb_id,
            resena_padre_id=resena.resena_padre_id,
            plataforma_id=resena.plataforma_id,
            calificacion=float(resena.calificacion),
            texto=resena.texto,
            fecha=resena.fecha,
            valoracion=int(valoracion),
            autor=AutorResena.model_validate(usuario, from_attributes=True),
        )
        for resena, usuario, valoracion in filas
    ]


def crear_resena(
    db: Session,
    tipo: TipoContenido,
    tmdb_id: int,
    usuario_id: UUID,
    datos: ResenaCreacion,
) -> ResenaCreadaRespuesta:
    # Comprobar el catálogo antes de agregar la entidad garantiza que un
    # contenido inexistente nunca deje una reseña pendiente en la sesión.
    detalle = obtener_detalle_contenido(tipo, tmdb_id)

    contenido = db.scalar(
        select(Contenido).where(
            Contenido.tmdb_id == tmdb_id,
            Contenido.tipo == tipo,
        )
    )
    if contenido is None:
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
    db.commit()
    db.refresh(resena)

    return ResenaCreadaRespuesta(
        mensaje="Reseña publicada correctamente",
        id=resena.id,
        usuario_id=resena.usuario_id,
        contenido_tmdb_id=resena.contenido_tmdb_id,
        resena_padre_id=resena.resena_padre_id,
        plataforma_id=resena.plataforma_id,
        calificacion=float(resena.calificacion),
        texto=resena.texto,
        fecha=resena.fecha,
    )


def _consultar_tmdb(ruta: str, tmdb_id: int) -> dict[str, Any]:
    if not settings.tmdb_access_token:
        raise CatalogoNoDisponibleError("El catálogo no está configurado")

    try:
        respuesta = httpx.get(
            f"{settings.tmdb_api_url}/{ruta}/{tmdb_id}",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {settings.tmdb_access_token}",
            },
            params={"language": "es-UY"},
            timeout=10,
        )
    except httpx.RequestError as error:
        raise CatalogoNoDisponibleError(
            "No fue posible consultar el catálogo"
        ) from error

    if respuesta.status_code == 404:
        raise ContenidoNoEncontradoError("Contenido no encontrado")

    try:
        respuesta.raise_for_status()
    except httpx.HTTPStatusError as error:
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
