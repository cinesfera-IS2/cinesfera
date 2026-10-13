from typing import Any

import httpx

from app.catalogue_service.entities.content import Content
from app.core.config import settings


class CatalogueUnavailableError(Exception):
    pass


class CatalogueRepository:

    def get_content(self, content_type=None, year=None):
        if content_type == "movie":
            contents = self._get_movies()
        elif content_type == "series":
            contents = self._get_series()
        else:
            contents = self._get_movies() + self._get_series()

        if year is not None:
            contents = [
                content for content in contents
                if content.release_date and content.release_date[:4] == str(year)
            ]

        return sorted(
            contents,
            key=lambda content: content.release_date or "",
            reverse=True
        )

    def search_movie_by_name(self, name):
        data = self._request("search/movie", {"query": name})
        return [self._movie_to_content(movie) for movie in data["results"]]

    def search_series_by_name(self, name):
        data = self._request("search/tv", {"query": name})
        return [self._series_to_content(series) for series in data["results"]]

    def search_catalogue(self, query):
        return self.search_movie_by_name(query) + self.search_series_by_name(query)

    def _get_movies(self):
        data = self._request(
            "discover/movie",
            {"sort_by": "primary_release_date.desc", "page": 1}
        )
        return [self._movie_to_content(movie) for movie in data["results"]]

    def _get_series(self):
        data = self._request(
            "discover/tv",
            {"sort_by": "first_air_date.desc", "page": 1}
        )
        return [self._series_to_content(series) for series in data["results"]]

    def _request(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        if not settings.tmdb_access_token:
            raise CatalogueUnavailableError("El catálogo no está configurado")

        try:
            response = httpx.get(
                f"{settings.tmdb_api_url}/{path}",
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {settings.tmdb_access_token}",
                },
                params={"language": "es-ES", **params},
                timeout=10,
            )
            response.raise_for_status()
        except httpx.HTTPError as error:
            raise CatalogueUnavailableError(
                "No fue posible consultar el catálogo"
            ) from error

        return response.json()

    def _movie_to_content(self, movie):
        return Content(
            title=movie.get("title"),
            content_type="movie",
            release_date=movie.get("release_date") or None,
            summary=movie.get("overview"),
            poster_url=self._poster_url(movie.get("poster_path")),
            tmdb_id=movie.get("id")
        )

    def _series_to_content(self, series):
        return Content(
            title=series.get("name"),
            content_type="series",
            release_date=series.get("first_air_date") or None,
            summary=series.get("overview"),
            poster_url=self._poster_url(series.get("poster_path")),
            tmdb_id=series.get("id")
        )

    def _poster_url(self, poster_path):
        if not poster_path:
            return None
        return f"{settings.tmdb_image_url}/w500{poster_path}"
