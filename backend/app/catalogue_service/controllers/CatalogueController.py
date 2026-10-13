from typing import Literal

from fastapi import APIRouter, HTTPException, status

from app.catalogue_service.entities.content import Content
from app.catalogue_service.repositories.CatalogueRepository import CatalogueUnavailableError
from app.catalogue_service.services.CatalogueService import CatalogueService


router = APIRouter(prefix="/catalogue", tags=["Catálogo"])

service = CatalogueService()


@router.get("/", response_model=list[Content])
def get_catalogue(
    search: str | None = None,
    content_type: Literal["movie", "series"] | None = None,
    year: int | None = None
) -> list[Content]:
    try:
        if search:
            if content_type == "movie":
                return service.search_movie_by_name(search)

            if content_type == "series":
                return service.search_series_by_name(search)

            return service.search_catalogue(search)

        return service.get_content(content_type, year)
    except CatalogueUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(error),
        ) from error
