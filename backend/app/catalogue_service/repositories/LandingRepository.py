import httpx

from app.catalogue_service.repositories.CatalogueRepository import CatalogueRepository


# TMDB no deja pedir páginas mayores a 500
PAGINA_MAXIMA_TMDB = 500


class LandingRepository(CatalogueRepository):
    """Listas que arma TMDB para la portada. Hereda del catálogo la conexión
    y las conversiones a Content, así las obras llegan con la misma forma."""

    def get_highlights(self, page):
        # Las películas con más votos son las más vistas y conocidas: las que
        # cualquiera tiene algo para opinar. /movie/popular mide el revuelo del
        # momento y se pisaría con las tendencias.
        data = self._get_tmdb(
            "/discover/movie",
            {"sort_by": "vote_count.desc", "include_adult": "false", "page": page},
        )

        contents = [self.movie_to_content(movie) for movie in data["results"]]

        return contents, min(data["total_pages"], PAGINA_MAXIMA_TMDB)

    def get_trending(self, content_type, page):
        media_type = {"movie": "movie", "series": "tv"}.get(content_type, "all")
        data = self._get_tmdb(f"/trending/{media_type}/week", {"page": page})

        contents = []
        for item in data["results"]:
            # /trending/all también trae personas; acá solo interesan las obras.
            tipo = item.get("media_type", media_type)
            if tipo == "movie":
                contents.append(self.movie_to_content(item))
            elif tipo == "tv":
                contents.append(self.series_to_content(item))

        return contents, min(data["total_pages"], PAGINA_MAXIMA_TMDB)

    def _get_tmdb(self, path, params):
        response = httpx.get(
            f"{self.base_url}{path}",
            headers=self.headers,
            params={"language": "es-MX", **params},
            timeout=10,
        )

        response.raise_for_status()

        return response.json()
