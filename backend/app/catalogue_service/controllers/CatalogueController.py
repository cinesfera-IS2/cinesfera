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

class CatalogueResponse(BaseModel):
    contents: list[ContentResponse]
    total_pages: int            

@router.get("/", response_model=CatalogueResponse)
def get_catalogue(
    search: str = None,
    content_type: str = None,
    year: int = None,
    page: int = 1
):
    if search:
        if content_type == "movie":
            contents = service.search_movie_by_name(search)
            return CatalogueResponse(contents=contents, total_pages=1)

        if content_type == "series":
            contents = service.search_series_by_name(search)
            return CatalogueResponse(contents=contents, total_pages=1)

        contents = service.search_catalogue(search)
        return CatalogueResponse(contents=contents, total_pages=1)

    contents, total_pages = service.get_content(
        content_type, year, page
    )

    return CatalogueResponse(
        contents=contents,
        total_pages=total_pages
    )