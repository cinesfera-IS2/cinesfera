from datetime import datetime, timezone
from zoneinfo import ZoneInfo


ZONA_HORARIA_URUGUAY = ZoneInfo("America/Montevideo")


def suspension_vencida(suspension_hasta: datetime | None) -> bool:
    if suspension_hasta is None:
        return False
    return _como_utc(suspension_hasta) <= datetime.now(timezone.utc)


def mensaje_cuenta_suspendida(suspension_hasta: datetime | None) -> str:
    """Construye el mensaje público sin exponer el motivo administrativo."""
    if suspension_hasta is None:
        return "Tu cuenta ha sido suspendida"

    # PostgreSQL devuelve fechas con zona. El fallback permite manejar de forma
    # segura valores antiguos o provenientes de SQLite que no tengan tzinfo.
    fecha_uruguay = _como_utc(suspension_hasta).astimezone(ZONA_HORARIA_URUGUAY)
    fecha_formateada = fecha_uruguay.strftime("%d/%m/%Y a las %H:%M")
    return (
        "Tu cuenta ha sido suspendida. "
        f"Podrás volver a ingresar el {fecha_formateada} (hora de Uruguay)."
    )


def _como_utc(fecha: datetime) -> datetime:
    if fecha.tzinfo is None:
        return fecha.replace(tzinfo=timezone.utc)
    return fecha.astimezone(timezone.utc)
