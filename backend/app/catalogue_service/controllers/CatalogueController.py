from services.CatalogueService import CatalogueService 


class CatalogueController:

    def __init__(self):
        self.service = CatalogueService()

    def get_catalogue(self, type=None, year=None, search=None):

        if search:
            if type == "movie":
                return self.service.search_movie_by_name(search)

            if type == "series":
                return self.service.search_series_by_name(search)

            return self.service.search_catalogue(search)

        return self.service.get_content(type, year)

