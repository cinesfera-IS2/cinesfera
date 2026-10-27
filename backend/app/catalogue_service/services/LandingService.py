from app.catalogue_service.repositories.LandingRepository import LandingRepository


class LandingService:

    def __init__(self):
        self.repository = LandingRepository()

    def get_highlights(self, page=1):
        return self.repository.get_highlights(page)

    def get_trending(self, content_type=None, page=1):
        return self.repository.get_trending(content_type, page)
