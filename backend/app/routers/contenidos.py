from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.core.csrf import verificar_csrf
from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.models.usuario import Usuario
from app.schemas.contenido import (
    ContenidoDetalleRespuesta,
    ResenaCreacion,
    ResenaCreadaRespuesta,
    ResenaContenidoRespuesta,
    TipoContenido,
)
from app.services.contenido_service import (
    CatalogoNoDisponibleError,
    ContenidoNoEncontradoError,
    ResenaPadreInvalidaError,
    ResenaPadreNoEncontradaError,
    crear_resena,
    obtener_detalle_contenido,
    obtener_resenas_contenido,
)


router = APIRouter(prefix="/contenidos", tags=["Contenidos"])


@router.post(
    "/{tipo}/{tmdb_id}/resenas",
    response_model=ResenaCreadaRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_csrf)],
)
def publicar_resena(
    tipo: TipoContenido,
    tmdb_id: Annotated[int, Path(gt=0)],
    datos: ResenaCreacion,
    db: Annotated[Session, Depends(get_db)],
    usuario_actual: Annotated[Usuario, Depends(obtener_usuario_actual)],
) -> ResenaCreadaRespuesta:
    if datos.usuario_id != usuario_actual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para publicar por otro usuario",
        )

    try:
        return crear_resena(db, tipo, tmdb_id, usuario_actual.id, datos)
    except ContenidoNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except CatalogoNoDisponibleError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
    except ResenaPadreNoEncontradaError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except ResenaPadreInvalidaError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error


@router.get(
    "/{tipo}/{tmdb_id}",
    response_model=ContenidoDetalleRespuesta,
)
def consultar_contenido(
    tipo: TipoContenido,
    tmdb_id: Annotated[int, Path(gt=0)],
) -> ContenidoDetalleRespuesta:
    try:
        return obtener_detalle_contenido(tipo, tmdb_id)
    except ContenidoNoEncontradoError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error
    except CatalogoNoDisponibleError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error


@router.get(
    "/{tipo}/{tmdb_id}/resenas",
    response_model=list[ResenaContenidoRespuesta],
)
def consultar_resenas_contenido(
    tipo: TipoContenido,
    tmdb_id: Annotated[int, Path(gt=0)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ResenaContenidoRespuesta]:
    # Una película y una serie pueden compartir el id de TMDB: el tipo es parte
    # de la identidad del contenido.
    return obtener_resenas_contenido(db, tipo, tmdb_id)
