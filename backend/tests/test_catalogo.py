import unittest
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


def respuesta_tmdb(url, **_kwargs):
    resultados = PELICULAS if url.endswith("/movie") else SERIES
    return httpx.Response(
        200,
        json={"results": resultados},
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
        return [contenido["title"] for contenido in respuesta.json()]

    def test_catalogo_mezcla_peliculas_y_series_ordenadas_por_fecha(self, get):
        get.side_effect = respuesta_tmdb

        respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(
            self.titulos(respuesta),
            ["Serie", "Película nueva", "Película vieja"],
        )
        serie = respuesta.json()[0]
        self.assertEqual(serie["content_type"], "series")
        self.assertEqual(serie["release_date"], "2024-09-01")
        self.assertEqual(
            serie["poster_url"],
            f"{settings.tmdb_image_url}/w500/serie.jpg",
        )
        self.assertIsNone(respuesta.json()[2]["poster_url"])

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

    def test_tipo_invalido_responde_422(self, get):
        respuesta = self.client.get("/catalogue/?content_type=documental")

        self.assertEqual(respuesta.status_code, 422)
        get.assert_not_called()

    def test_tmdb_caido_responde_502(self, get):
        get.side_effect = httpx.ConnectError("sin conexión")

        respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.status_code, 502)

    def test_sin_token_responde_502_sin_llamar_a_tmdb(self, get):
        with patch.object(settings, "tmdb_access_token", ""):
            respuesta = self.client.get("/catalogue/")

        self.assertEqual(respuesta.status_code, 502)
        self.assertEqual(
            respuesta.json()["detail"], "El catálogo no está configurado"
        )
        get.assert_not_called()


if __name__ == "__main__":
    unittest.main()
