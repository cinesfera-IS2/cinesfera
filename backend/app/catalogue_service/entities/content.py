from dataclasses import dataclass


@dataclass(frozen=True)
class Content:
    title: str
    content_type: str
    # Se guarda la fecha completa para poder ordenar; el año sale de release_date[:4].
    release_date: str | None
    summary: str | None
    poster_url: str | None
    tmdb_id: int
