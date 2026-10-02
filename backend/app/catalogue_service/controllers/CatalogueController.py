from fastapi import APIRouter

from services.CatalogueService import CatalogueService


router = APIRouter(prefix="/catalogue")

service = CatalogueService()


@router.get("/")
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