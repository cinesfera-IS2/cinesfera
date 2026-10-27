"""Lecturas de TMDB con conexión reutilizable, IPv4 y reintentos acotados."""

import atexit
from collections import OrderedDict
from functools import lru_cache
from threading import Lock
from time import monotonic, sleep

import httpx

from app.core.config import settings


TRANSITORIOS = {429, 500, 502, 503, 504}
TTL = 60
MAX_ANTIGUEDAD = 300
MAX_ENTRADAS = 128
_cache: OrderedDict[tuple, tuple[float, httpx.Response]] = OrderedDict()
_lock = Lock()


@lru_cache(maxsize=1)
def obtener_cliente_tmdb() -> httpx.Client:
    return httpx.Client(
        transport=httpx.HTTPTransport(
            local_address="0.0.0.0" if settings.tmdb_force_ipv4 else None,
        ),
        timeout=httpx.Timeout(10, connect=5),
    )


def cerrar_cliente_tmdb() -> None:
    if obtener_cliente_tmdb.cache_info().currsize:
        obtener_cliente_tmdb().close()
        obtener_cliente_tmdb.cache_clear()


atexit.register(cerrar_cliente_tmdb)


def limpiar_cache_tmdb() -> None:
    with _lock:
        _cache.clear()


def _solicitar(url: str, **opciones) -> httpx.Response:
    return obtener_cliente_tmdb().get(url, **opciones)


def consultar_tmdb(url: str, *, headers: dict, params: dict) -> httpx.Response:
    # La caché contiene solo GET públicos de catálogo, separados por token.
    clave = (str(httpx.URL(url, params=params)), tuple(sorted(headers.items())))
    with _lock:
        anterior = _cache.get(clave)
        if anterior and monotonic() - anterior[0] < TTL:
            return anterior[1]

    for intento in range(3):
        try:
            respuesta = _solicitar(url, headers=headers, params=params)
            respuesta.raise_for_status()
        except httpx.HTTPStatusError as error:
            if error.response.status_code not in TRANSITORIOS:
                raise
            problema = error
        except httpx.TransportError as error:
            problema = error
        else:
            with _lock:
                _cache[clave] = (monotonic(), respuesta)
                _cache.move_to_end(clave)
                while len(_cache) > MAX_ENTRADAS:
                    _cache.popitem(last=False)
            return respuesta

        if intento < 2:
            sleep(0.2 * (2 ** intento))

    # Un corte breve puede usar la última lectura exitosa de los mismos filtros.
    if anterior and monotonic() - anterior[0] <= MAX_ANTIGUEDAD:
        return anterior[1]
    raise problema
