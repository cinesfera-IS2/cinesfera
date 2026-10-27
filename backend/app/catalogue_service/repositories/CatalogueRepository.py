from datetime import date

from app.catalogue_service.entities.content import Content
from app.core.config import settings
from app.core.tmdb import consultar_tmdb


class CatalogueRepository:

    def __init__(self):
        self.base_url = settings.tmdb_api_url
        self.token = settings.tmdb_access_token

        self.headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {self.token}"
        }


    def _get(self, url, **kwargs):
        return consultar_tmdb(url, **kwargs)

    #defino dos funciones para que lo que devuelve la api pueda ser interpretado como objetos de la clase content
    
    def movie_to_content(self, movie):

            release_date = movie.get("release_date")

            return Content(
                title=movie.get("title"),
                content_type="movie",
                release_date=movie.get("release_date"),
                summary=movie.get("overview"),
                poster_url=(
                    f"https://image.tmdb.org/t/p/w500"
                    f"{movie['poster_path']}"
                    if movie.get("poster_path")
                    else None
                ),
                tmdb_id=movie.get("id")
            )

    def series_to_content(self, series):

            first_air_date = series.get("first_air_date")

            return Content(
                title=series.get("name"),
                content_type="series",
                release_date=first_air_date,
                summary=series.get("overview"),
                poster_url=(
                    f"https://image.tmdb.org/t/p/w500"
                    f"{series['poster_path']}"
                    if series.get("poster_path")
                    else None
                ),
                tmdb_id=series.get("id")
            )

    #función que devuelva las películas y las transforme a clase content usando la funcion movie_to_content
    def get_movies(self, page, year):
        url = f"{self.base_url}/discover/movie"

        params = {
                "language": "es-ES",
                "sort_by": "primary_release_date.desc",
                "primary_release_date.lte": date.today().isoformat(),
                "page": page
            }

        if year is not None:
            params["primary_release_year"] = year

        response = self._get(
                url,
                headers=self.headers,
                params=params
            )

        response.raise_for_status()

        data = response.json()

        contents = []

        for movie in data["results"]:
            contents.append(self.movie_to_content(movie))

        total_pages = data["total_pages"]

        return contents, total_pages

    #misma función pero para series

    def get_series(self, page, year):
        url = f"{self.base_url}/discover/tv"

        params = {
            "language": "es-ES",
            "sort_by": "first_air_date.desc",
            "first_air_date.lte": date.today().isoformat(),
            "page": page
        }

        if year is not None:
            params["first_air_date_year"] = year

        response = self._get(
            url,
            headers=self.headers,
            params=params
        )

        response.raise_for_status()

        data = response.json()

        contents = []

        for series in data["results"]:
            contents.append(self.series_to_content(series))


        total_pages = data["total_pages"]

        return contents, total_pages

    #funcion para devolver todas las películas y series que se devuelven en un solo catalogo
    #tmb permite filtrar por película/serie y/o año 
    def get_content(self, content_type=None, year=None, page = None):

    #si se filtra para que catálogo solo devuelva películas
        if content_type == "movie":
            contents, total_pages = self.get_movies(page, year)

    #si se filtra para solo devolver series
        elif content_type == "series":
            contents, total_pages = self.get_series(page, year)

    #si no hay filtro por tipo devuelve ambas listas juntas 
        else:
            movies, total_pages_movies = self.get_movies(page, year)
            series, total_pages_series = self.get_series(page, year)
            contents = movies + series
            total_pages = max(total_pages_movies, total_pages_series)

    #si se filtra por año 
        if year is not None:
            contents = [
                content for content in contents
                if content.release_date and content.release_date[:4] == str(year)
            ]

        #ordeno la lista que puede tener series y películas para que ambas queden ordenadas por release date y la devuelvo 

        contents.sort(
            key=lambda content: content.release_date or "",
            reverse=True
        )

        #tmdb no deja pedir páginas mayores a 500
        total_pages = min(total_pages, 500)

        return contents, total_pages



    #para realizar búsquedas 

    def search_movie_by_name(self, name, year):

        url = f"{self.base_url}/search/movie"

        params = {
            "query": name,
            "language": "es-ES"
        }

        if year is not None:
            params["year"] = year

        response = self._get(url, headers=self.headers, params=params)

        response.raise_for_status()

        data = response.json()

        contents = []

        for movie in data["results"]:
                contents.append(self.movie_to_content(movie))

        if year is not None:
            contents = [
                content for content in contents
                if content.release_date
                and content.release_date.startswith(str(year))
            ]

        contents.sort(
            key=lambda content: content.release_date or "",
            reverse=True
        )
    
        return contents
    

    def search_series_by_name(self, name, year):
    
            url = f"{self.base_url}/search/tv"
    
            params = {
                "query": name,
                "language": "es-ES"
            }

            if year is not None:
                params["first_air_date_year"] = year
    
            response = self._get(url, headers=self.headers, params=params)
    
            response.raise_for_status()
    
            data = response.json()
    
            contents = []
    
            for series in data["results"]:
                    contents.append(self.series_to_content(series))

            contents.sort(
                key=lambda content: content.release_date or "",
                reverse=True
            )
           
            return contents

        #def search_by_keyword (tmb podria implementarlo? )

    def search_catalogue(self, query, year):
        movies = self.search_movie_by_name(query, year)
        series = self.search_series_by_name(query, year)

        contents = movies + series


        if year is not None:
            contents = [
                content for content in contents
                if content.release_date
                and content.release_date.startswith(str(year))
            ]

        contents.sort(
            key=lambda content: content.release_date or "",
            reverse=True
        )

        return contents
    

    def search_keyword(self):
        pass
    

    #puede ser útil más adelante
    def search_by_id(self, id):
            pass
