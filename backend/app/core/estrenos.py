from datetime import date, datetime
from zoneinfo import ZoneInfo

ZONA_URUGUAY = ZoneInfo("America/Montevideo")


def es_proximo_estreno(fecha: date | str | None) -> bool:
    """Sin fecha no se asume futuro: TMDB tiene muchas obras viejas sin fecha cargada."""
    if not fecha:
        return False

    if isinstance(fecha, str):
        fecha = date.fromisoformat(fecha[:10])

    return fecha > datetime.now(ZONA_URUGUAY).date()
