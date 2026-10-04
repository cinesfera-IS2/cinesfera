from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.contenido import (
    ContenidoDetalleRespuesta,
    ResenaContenidoRespuesta,
    TipoContenido,
)
from app.services.contenido_service import (
    CatalogoNoDisponibleError,
    ContenidoNoEncontradoError,
    obtener_detalle_contenido,
    obtener_resenas_contenido,
)


router = APIRouter(prefix="/contenidos", tags=["Contenidos"])


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
