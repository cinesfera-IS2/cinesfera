from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException

from app.catalogue_service.controllers.CatalogueController import CatalogueResponse
from app.catalogue_service.services.LandingService import LandingService


router = APIRouter(prefix="/catalogue")

service = LandingService()


def validar_pagina(page: int):
    if page < 1 or page > 500:
        raise HTTPException(status_code=400, detail="La página debe estar entre 1 y 500")


@router.get("/highlights", response_model=CatalogueResponse)
def get_highlights(page: int = 1):
    """Las películas más conocidas (con más votos en TMDB), para "Joyas de la cartelera"."""
    validar_pagina(page)

    try:
        contents, total_pages = service.get_highlights(page)
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="No fue posible consultar el catálogo") from error

    return CatalogueResponse(contents=contents, total_pages=total_pages)


@router.get("/trending", response_model=CatalogueResponse)
def get_trending(content_type: Literal["movie", "series"] | None = None, page: int = 1):
    """Lo que está en tendencia en TMDB esta semana, para "Tendencias de la semana"."""
    validar_pagina(page)

    try:
        contents, total_pages = service.get_trending(content_type, page)
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail="No fue posible consultar el catálogo") from error

    return CatalogueResponse(contents=contents, total_pages=total_pages)
