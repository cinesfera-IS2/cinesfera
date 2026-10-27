import unittest
from unittest.mock import patch

import httpx
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


PELICULAS_CONOCIDAS = [
    {
        "id": 27205,
        "title": "El origen",
        "release_date": "2010-07-15",
        "overview": "Resumen",
        "poster_path": "/origen.jpg",
    },
    {
        "id": 157336,
        "title": "Interstellar",
        "release_date": "2014-11-05",
        "overview": "Resumen",
        "poster_path": None,
    },
]

TENDENCIAS = [
    {
        "id": 1399,
        "media_type": "tv",
        "name": "Juego de tronos",
        "first_air_date": "2011-04-17",
        "overview": "Resumen",
        "poster_path": "/tronos.jpg",
    },
    {
        "id": 31,
        "media_type": "person",
        "name": "Tom Hanks",
        "profile_path": "/hanks.jpg",
    },
    {
        "id": 603,
        "media_type": "movie",
        "title": "Matrix",
        "release_date": "1999-03-31",
        "overview": "Resumen",
        "poster_path": "/matrix.jpg",
    },
]


def respuesta(url, resultados, total_paginas=40):
    return httpx.Response(
        200,
        json={"results": resultados, "total_pages": total_paginas},
        request=httpx.Request("GET", url),
    )


@patch("app.catalogue_service.repositories.LandingRepository.httpx.get")
class PortadaTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        token = patch.object(settings, "tmdb_access_token", "token-de-prueba")
        token.start()
        self.addCleanup(token.stop)

    def titulos(self, respuesta_api):
        return [contenido["title"] for contenido in respuesta_api.json()["contents"]]

    def test_joyas_pide_las_peliculas_con_mas_votos(self, get):
        get.side_effect = lambda url, **_: respuesta(url, PELICULAS_CONOCIDAS)

        respuesta_api = self.client.get("/catalogue/highlights")

        self.assertEqual(respuesta_api.status_code, 200)
        self.assertEqual(self.titulos(respuesta_api), ["El origen", "Interstellar"])
        self.assertEqual(respuesta_api.json()["total_pages"], 40)
        url = get.call_args.args[0]
        params = get.call_args.kwargs["params"]
        self.assertTrue(url.endswith("/discover/movie"))
        self.assertEqual(params["sort_by"], "vote_count.desc")
        self.assertEqual(params["page"], 1)
        pelicula = respuesta_api.json()["contents"][0]
        self.assertEqual(pelicula["content_type"], "movie")
        self.assertEqual(pelicula["poster_url"], f"{settings.tmdb_image_url}/w500/origen.jpg")

    def test_joyas_respeta_la_pagina_pedida(self, get):
        get.side_effect = lambda url, **_: respuesta(url, PELICULAS_CONOCIDAS)

        self.client.get("/catalogue/highlights?page=3")

        self.assertEqual(get.call_args.kwargs["params"]["page"], 3)

    def test_tendencias_mezcla_peliculas_y_series_y_descarta_personas(self, get):
        get.side_effect = lambda url, **_: respuesta(url, TENDENCIAS)

        respuesta_api = self.client.get("/catalogue/trending")

        self.assertEqual(respuesta_api.status_code, 200)
        self.assertTrue(get.call_args.args[0].endswith("/trending/all/week"))
        self.assertEqual(self.titulos(respuesta_api), ["Juego de tronos", "Matrix"])
        tipos = [contenido["content_type"] for contenido in respuesta_api.json()["contents"]]
        self.assertEqual(tipos, ["series", "movie"])

    def test_tendencias_filtra_por_tipo(self, get):
        get.side_effect = lambda url, **_: respuesta(
            url, [item for item in TENDENCIAS if item["media_type"] == "tv"]
        )

        respuesta_api = self.client.get("/catalogue/trending?content_type=series&page=2")

        self.assertTrue(get.call_args.args[0].endswith("/trending/tv/week"))
        self.assertEqual(get.call_args.kwargs["params"]["page"], 2)
        self.assertEqual(self.titulos(respuesta_api), ["Juego de tronos"])

    def test_tendencias_de_peliculas_pide_la_lista_de_peliculas(self, get):
        get.side_effect = lambda url, **_: respuesta(
            url, [item for item in TENDENCIAS if item["media_type"] == "movie"]
        )

        respuesta_api = self.client.get("/catalogue/trending?content_type=movie")

        self.assertTrue(get.call_args.args[0].endswith("/trending/movie/week"))
        self.assertEqual(self.titulos(respuesta_api), ["Matrix"])

    def test_tipo_desconocido_se_rechaza(self, get):
        respuesta_api = self.client.get("/catalogue/trending?content_type=documental")

        self.assertEqual(respuesta_api.status_code, 422)
        get.assert_not_called()

    def test_tmdb_no_deja_pasar_de_la_pagina_500(self, get):
        get.side_effect = lambda url, **_: respuesta(url, PELICULAS_CONOCIDAS, total_paginas=12000)

        respuesta_api = self.client.get("/catalogue/highlights")

        self.assertEqual(respuesta_api.json()["total_pages"], 500)

    def test_pagina_fuera_de_rango_devuelve_400(self, get):
        for ruta in ("/catalogue/highlights?page=0", "/catalogue/trending?page=501"):
            with self.subTest(ruta=ruta):
                respuesta_api = self.client.get(ruta)

                self.assertEqual(respuesta_api.status_code, 400)
                self.assertEqual(
                    respuesta_api.json()["detail"], "La página debe estar entre 1 y 500"
                )
        get.assert_not_called()

    def test_si_tmdb_falla_responde_503(self, get):
        get.side_effect = httpx.ConnectError("sin conexión")

        for ruta in ("/catalogue/highlights", "/catalogue/trending"):
            with self.subTest(ruta=ruta):
                respuesta_api = self.client.get(ruta)

                self.assertEqual(respuesta_api.status_code, 503)
                self.assertEqual(
                    respuesta_api.json()["detail"], "No fue posible consultar el catálogo"
                )

    def test_si_tmdb_responde_con_error_responde_503(self, get):
        get.side_effect = lambda url, **_: httpx.Response(
            401, json={}, request=httpx.Request("GET", url)
        )

        respuesta_api = self.client.get("/catalogue/trending")

        self.assertEqual(respuesta_api.status_code, 503)


if __name__ == "__main__":
    unittest.main()
