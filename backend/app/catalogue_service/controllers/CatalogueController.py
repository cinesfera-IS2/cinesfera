from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

from app.catalogue_service.services.CatalogueService import CatalogueService


router = APIRouter(prefix="/catalogue")

service = CatalogueService()


# Content guarda sus campos como atributos privados; sin este modelo FastAPI
# los serializa con nombres como "_Content__title".
class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    title: str
    content_type: str
    release_date: str | None
    summary: str | None
    poster_url: str | None
    tmdb_id: int


@router.get("/", response_model=list[ContentResponse])
def get_catalogue(
    search: str = None,
    content_type: str = None,
    year: int = None
):

    if search:
        if content_type == "movie":
            return service.search_movie_by_name(search)

        if content_type == "series":
            return service.search_series_by_name(search)

        return service.search_catalogue(search)

    return service.get_content(content_type, year)