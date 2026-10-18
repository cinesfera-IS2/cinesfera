import unittest
from datetime import date
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


PELICULAS = [
    {
        "id": 1,
        "title": "Película nueva",
        "release_date": "2024-05-01",
        "overview": "Resumen",
        "poster_path": "/pelicula.jpg",
    },
    {
        "id": 2,
        "title": "Película vieja",
        "release_date": "2020-01-01",
        "overview": "Resumen",
        "poster_path": None,
    },
]

SERIES = [
    {
        "id": 3,
        "name": "Serie",
        "first_air_date": "2024-09-01",
        "overview": "Resumen",
        "poster_path": "/serie.jpg",
    },
]


def respuesta_tmdb(url, paginas_peliculas=300, paginas_series=120, **_kwargs):
    if url.endswith("/movie"):
        resultados, total_paginas = PELICULAS, paginas_peliculas
    else:
        resultados, total_paginas = SERIES, paginas_series
    return httpx.Response(
        200,
        json={"results": resultados, "total_pages": total_paginas},
        request=httpx.Request("GET", url),
    )


@patch("app.catalogue_service.repositories.CatalogueRepository.httpx.get")
class CatalogoTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        token = patch.object(settings, "tmdb_access_token", "token-de-prueba")
        token.start()
        self.addCleanup(token.stop)

    def titulos(self, respuesta):
        return [contenido["title"] for contenido in respuesta.json()["contents"]]

    def test_catalogo_mezcla_peliculas_y_series_ordenadas_por_fecha(self, get):
        get.side_effect = respuesta_tmdb

        respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            self.titulos(respuesta),
            ["Serie", "Película nueva", "Película vieja"],
        )
        serie = respuesta.json()["contents"][0]
        self.assertEqual(serie["content_type"], "series")
        self.assertEqual(serie["release_date"], "2024-09-01")
        self.assertEqual(
            serie["poster_url"],
            f"{settings.tmdb_image_url}/w500/serie.jpg",
        )
        self.assertIsNone(respuesta.json()["contents"][2]["poster_url"])

    def test_catalogo_sin_tipo_devuelve_el_maximo_de_paginas(self, get):
        get.side_effect = respuesta_tmdb

        respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.json()["total_pages"], 300)

    def test_catalogo_limita_el_total_de_paginas_a_500(self, get):
        get.side_effect = lambda url, **kwargs: respuesta_tmdb(
            url, paginas_peliculas=38000, paginas_series=7000
        )

        respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.json()["total_pages"], 500)

    def test_catalogo_envia_la_pagina_pedida_y_valida_el_rango(self, get):
        get.side_effect = respuesta_tmdb

        respuesta = self.client.get("/catalogue/?content_type=movie&page=3")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(get.call_args.kwargs["params"]["page"], 3)
        self.assertEqual(self.client.get("/catalogue/?page=0").status_code, 400)
        self.assertEqual(self.client.get("/catalogue/?page=501").status_code, 400)

    def test_catalogo_solo_trae_lo_estrenado_hasta_hoy(self, get):
        get.side_effect = respuesta_tmdb
        hoy = date.today().isoformat()

        self.client.get("/catalogue/")

        peliculas, series = get.call_args_list
        self.assertEqual(peliculas.kwargs["params"]["primary_release_date.lte"], hoy)
        self.assertEqual(series.kwargs["params"]["first_air_date.lte"], hoy)

    def test_catalogo_filtra_por_tipo_y_anio(self, get):
        get.side_effect = respuesta_tmdb

        peliculas = self.client.get("/catalogue/?content_type=movie&year=2024")
        series = self.client.get("/catalogue/?content_type=series")

        self.assertEqual(self.titulos(peliculas), ["Película nueva"])
        self.assertEqual(self.titulos(series), ["Serie"])

    def test_busqueda_por_tipo_usa_el_endpoint_correspondiente(self, get):
        get.side_effect = respuesta_tmdb

        peliculas = self.client.get("/catalogue/?search=algo&content_type=movie")
        series = self.client.get("/catalogue/?search=algo&content_type=series")

        self.assertEqual(
            self.titulos(peliculas), ["Película nueva", "Película vieja"]
        )
        self.assertEqual(self.titulos(series), ["Serie"])
        self.assertTrue(get.call_args_list[0].args[0].endswith("/search/movie"))
        self.assertEqual(get.call_args_list[0].kwargs["params"]["query"], "algo")
        self.assertTrue(get.call_args_list[1].args[0].endswith("/search/tv"))

    def test_busqueda_sin_tipo_devuelve_peliculas_y_series(self, get):
        get.side_effect = respuesta_tmdb

        respuesta = self.client.get("/catalogue/?search=algo")

        self.assertEqual(
            self.titulos(respuesta),
            ["Película nueva", "Película vieja", "Serie"],
        )


if __name__ == "__main__":
    unittest.main()
