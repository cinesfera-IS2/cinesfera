from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.csrf import verificar_csrf
from app.database import get_db
from app.dependencies.auth import obtener_usuario_reportante
from app.models.usuario import Usuario
from app.schemas.moderacion import ReporteCreacion, ReporteCreadoRespuesta
from app.services.moderacion_service import (
    ConflictoModeracionError,
    LimiteReportesError,
    NoEncontradoError,
    crear_reporte,
)


router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.post(
    "",
    response_model=ReporteCreadoRespuesta,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verificar_csrf)],
)
def reportar(
    datos: ReporteCreacion,
    db: Annotated[Session, Depends(get_db)],
    usuario: Annotated[Usuario, Depends(obtener_usuario_reportante)],
) -> ReporteCreadoRespuesta:
    try:
        reporte = crear_reporte(db, usuario, datos)
        return ReporteCreadoRespuesta(id=reporte.id, estado=reporte.estado)
    except NoEncontradoError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ConflictoModeracionError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
    except LimiteReportesError as error:
        raise HTTPException(status_code=429, detail=str(error)) from error
