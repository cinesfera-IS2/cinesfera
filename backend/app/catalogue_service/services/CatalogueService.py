
from repositories.CatalogueRepository import CatalogueRepository


class CatalogueService:

    def __init__(self):
        self.repository = CatalogueRepository()

    def get_content(self, content_type=None, year=None):
        return self.repository.get_content(content_type, year)

    def search_catalogue(self, query):
        return self.repository.search_catalogue(query)

    def search_movie_by_name(self, query):
        return self.repository.search_movie_by_name(query)

    def search_series_by_name(self, query):
        return self.repository.search_series_by_name(query)