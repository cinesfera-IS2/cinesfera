import unittest
from unittest.mock import patch

import httpx

from app.core.tmdb import consultar_tmdb, limpiar_cache_tmdb


URL = "https://api.themoviedb.org/3/movie/550"


def respuesta(codigo=200):
    return httpx.Response(codigo, json={"id": 550}, request=httpx.Request("GET", URL))


@patch("app.core.tmdb.sleep")
@patch("app.core.tmdb._solicitar")
class TmdbTests(unittest.TestCase):
    def setUp(self):
        limpiar_cache_tmdb()
        self.addCleanup(limpiar_cache_tmdb)

    def consultar(self, **params):
        return consultar_tmdb(URL, headers={"Authorization": "Bearer prueba"}, params=params)

    def test_reutiliza_lectura_y_separa_filtros(self, solicitar, _sleep):
        solicitar.side_effect = [respuesta(), respuesta()]
        self.consultar(language="es")
        self.consultar(language="es")
        self.consultar(language="en")
        self.assertEqual(solicitar.call_count, 2)

    def test_reintenta_cortes_de_lectura_y_errores_transitorios(self, solicitar, _sleep):
        solicitar.side_effect = [httpx.ReadError("Corte"), respuesta(503), respuesta()]
        self.assertEqual(self.consultar().status_code, 200)
        self.assertEqual(solicitar.call_count, 3)

    def test_un_error_persistente_tiene_solo_tres_intentos(self, solicitar, _sleep):
        solicitar.side_effect = httpx.ConnectError("Corte")
        with self.assertRaises(httpx.ConnectError):
            self.consultar()
        self.assertEqual(solicitar.call_count, 3)

    def test_no_reintenta_errores_de_autenticacion_o_contenido(self, solicitar, _sleep):
        for codigo in (400, 401, 403, 404):
            with self.subTest(codigo=codigo):
                solicitar.reset_mock()
                solicitar.return_value = respuesta(codigo)
                with self.assertRaises(httpx.HTTPStatusError):
                    self.consultar()
                solicitar.assert_called_once()

    def test_usa_ultima_lectura_ante_corte_pero_no_si_esta_demasiado_vieja(self, solicitar, _sleep):
        solicitar.return_value = respuesta()
        with patch("app.core.tmdb.monotonic", return_value=100):
            self.consultar()
        solicitar.side_effect = httpx.ConnectError("Corte")
        with patch("app.core.tmdb.monotonic", return_value=170):
            self.assertEqual(self.consultar().json(), {"id": 550})
        with patch("app.core.tmdb.monotonic", return_value=401):
            with self.assertRaises(httpx.ConnectError):
                self.consultar()

    def test_cache_no_oculta_credenciales_invalidas(self, solicitar, _sleep):
        solicitar.return_value = respuesta()
        with patch("app.core.tmdb.monotonic", return_value=100):
            self.consultar()
        solicitar.return_value = respuesta(401)
        with patch("app.core.tmdb.monotonic", return_value=170):
            with self.assertRaises(httpx.HTTPStatusError):
                self.consultar()
