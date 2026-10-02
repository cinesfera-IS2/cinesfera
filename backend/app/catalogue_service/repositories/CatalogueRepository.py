import os
import requests

from entities.content import Content


class CatalogueRepository:

    def __init__(self):
        self.base_url = "https://api.themoviedb.org/3"
        self.api_key = os.getenv("TMDB_API_KEY")

        self.headers = {
            "accept": "application/json",
            "Authorization": f"Bearer {self.token}"
        }


#defino dos funciones para que lo que devuelve la api pueda ser interpretado como objetos de la clase content
    
def _movie_to_content(self, movie):

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

def _series_to_content(self, series):

        first_air_date = series.get("first_air_date")

        return Content(
            title=series.get("name"),
            content_type="series",
            release_date=series.get("release_date"),
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
def _get_movies(self):
    url = f"{self.base_url}/discover/movie"

    params = {
        "language": "es-ES",
        "sort_by": "primary_release_date.desc",
        "page": 1
    }

    response = requests.get(
        url,
        headers=self.headers,
        params=params
    )

    response.raise_for_status()

    data = response.json()

    contents = []

    for movie in data["results"]:
        contents.append(self._movie_to_content(movie))

    return contents

#misma función pero para series

def _get_series(self):
    url = f"{self.base_url}/discover/tv"

    params = {
        "language": "es-ES",
        "sort_by": "first_air_date.desc",
        "page": 1
    }

    response = requests.get(
        url,
        headers=self.headers,
        params=params
    )

    response.raise_for_status()

    data = response.json()

    contents = []

    for series in data["results"]:
        contents.append(self._series_to_content(series))

    return contents

#funcion para devolver todas las películas y series que se devuelven en un solo catalogo
#tmb permite filtrar por película/serie y/o año 
def get_content(self, content_type=None, year=None):


#si se filtra para que catálogo solo devuelva películas
    if content_type == "movie":
        contents = self._get_movies()
#si se filtra para solo devolver series
    elif content_type == "series":
        contents = self._get_series()

#si no hay filtro por tipo devuelve ambas listas juntas 
    else:
        movies = self._get_movies()
        series = self._get_series()
        contents = movies + series

#si se filtra por año 
    if year is not None:
        contents = [
            content for content in contents
            if content.release_date and content.release_date[:4] == str(year)
        ]

    #ordeno la lista que puede tener series y películas para que ambas queden ordenadas por release date y la devuelvo 

    return contents.sort(
        key=lambda content: content.release_date or "",
        reverse=True
    )



#para realizar búsquedas 

def search_movie_by_name(self, name):

    url = f"{self.base_url}/search/movie"

    params = {
            "api_key": self.api_key,
            "query": name,
            "language": "es-ES"
        }

    response = requests.get(url, params=params)

    response.raise_for_status()

    data = response.json()

    contents = []

    for movie in data["results"]:
            contents.append(self._movie_to_content(movie))
    
    return contents
    

def search_series_by_name(self, name):
    
        url = f"{self.base_url}/search/tv"
    
        params = {
                "api_key": self.api_key,
                "query": name,
                "language": "es-ES"
            }
    
        response = requests.get(url, params=params)
    
        response.raise_for_status()
    
        data = response.json()
    
        contents = []
    
        for series in data["results"]:
                contents.append(self._series_to_content(series))
           
        return contents

    #def search_by_keyword (tmb podria implementarlo? )

def search_catalogue(self, query):
    movies = self.search_movies(query)
    series = self.search_series(query)

    return movies + series
    

def search_keyword():
    pass
    
def search_seasons():
    pass

def search_episodes():
    pass

#puede ser útil más adelante
def search_by_id(self, id):
        pass
