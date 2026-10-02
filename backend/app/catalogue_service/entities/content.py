
class content:
    def __init__(self, title, content_type, release_date, summary, poster_url, tmdb_id):
        self.__title = title
        self.__content_type = content_type
        self.__release_date = release_date
        self.__summary = summary
        self.__poster_url = poster_url
        self.__tmdb_id = tmdb_id

    @property
    def title(self):
        return self.__title

    @property
    def content_type(self):
        return self.__content_type

#voy a usar release date en lugar de year así puedo hacer el order by cuando devuelvo catálogo más específico
#después para devolver al usuario hago release_date[:4] y solo muestro el año si quiero

    @property
    def release_date(self):
        return self.__release_date

    @property
    def summary(self):
        return self.__summary

    @property
    def poster_url(self):
        return self.__poster_url

    @property
    def tmdb_id(self):
        return self.__tmdb_id
     
