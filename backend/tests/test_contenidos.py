import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import httpx

from app.core.config import settings
from app.core.tmdb import limpiar_cache_tmdb
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena, ValoracionResena
from app.models.usuario import Usuario
from app.routers.contenidos import consultar_generos
from app.schemas.contenido import ContenidoDetalleRespuesta, GeneroContenido
from app.services.contenido_service import (
    CatalogoNoDisponibleError,
    ContenidoNoEncontradoError,
    GeneroFavoritoInvalidoError,
    _consultar_tmdb,
    _url_imagen,
    obtener_detalle_contenido,
    obtener_generos_contenido,
    normalizar_generos_favoritos,
)
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class ContenidosTests(unittest.TestCase):
    def setUp(self):
        limpiar_cache_tmdb()
        self.addCleanup(limpiar_cache_tmdb)
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, ValoracionResena, CalificacionResena
        )
        ahora = datetime.now(timezone.utc)
        # La serie comparte id de TMDB con la película a propósito: sus
        # reseñas no deben mezclarse.
        self.db.add_all([
            Contenido(id=1, tmdb_id=550, tipo="pelicula"),
            Contenido(id=2, tmdb_id=999, tipo="pelicula"),
            Contenido(id=3, tmdb_id=550, tipo="serie"),
        ])
        ana = crear_usuario(self.db, "ana", nombre="Ana", apellido="Pérez")
        bea = crear_usuario(self.db, "bea", nombre="Bea", apellido="Silva")
        self.reciente_id = uuid4()
        self.antigua_id = uuid4()
        ajena_id = uuid4()
        self.serie_id = uuid4()

        self.db.add_all([
            Resena(
                id=self.antigua_id,
                usuario_id=ana.id,
                contenido_id=1,
                plataforma_id=None,
                calificacion=Decimal("4.0"),
                texto="La primera reseña",
                fecha=ahora - timedelta(days=2),
            ),
            Resena(
                id=self.reciente_id,
                usuario_id=bea.id,
                contenido_id=1,
                plataforma_id=3,
                calificacion=Decimal("4.5"),
                texto="La reseña más reciente",
                fecha=ahora,
            ),
            Resena(
                id=ajena_id,
                usuario_id=ana.id,
                contenido_id=2,
                plataforma_id=None,
                calificacion=Decimal("2.0"),
                texto="Pertenece a otro contenido",
                fecha=ahora + timedelta(days=1),
            ),
            Resena(
                id=self.serie_id,
                usuario_id=bea.id,
                contenido_id=3,
                plataforma_id=None,
                calificacion=Decimal("3.0"),
                texto="Reseña de la serie con el mismo id",
                fecha=ahora + timedelta(days=1),
            ),
        ])
        self.db.flush()
        self.db.add_all([
            ValoracionResena(
                usuario_id=ana.id, resena_id=self.reciente_id, valor=1
            ),
            ValoracionResena(
                usuario_id=bea.id, resena_id=self.antigua_id, valor=-1
            ),
        ])
        self.db.commit()
        self.client = conectar_api(self, self.db)

    def _calificar(self, resena_id, estrellas):
        usuario = crear_usuario(self.db, f"votante-{uuid4().hex}")
        calificacion = CalificacionResena(
            usuario_id=usuario.id,
            resena_id=resena_id,
            calificacion=Decimal(str(estrellas)),
            fecha_actualizacion=datetime.now(timezone.utc),
        )
        self.db.add(calificacion)
        self.db.commit()
        return calificacion

    def _comprobar_promedio(self, promedio, cantidad, resena_id=None):
        respuesta = self.client.get("/contenidos/pelicula/550/resenas")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        resena = next(
            fila for fila in respuesta.json()
            if fila["id"] == str(resena_id or self.reciente_id)
        )
        self.assertEqual(resena["promedio_comunitario"], promedio)
        self.assertEqual(resena["cantidad_valoraciones"], cantidad)

    def test_promedio_comunitario_de_dos_valoraciones(self):
        self._calificar(self.reciente_id, 3)
        self._calificar(self.reciente_id, 5)
        self._comprobar_promedio(4, 2)

    def test_promedio_se_actualiza_al_agregar_valoracion(self):
        self._calificar(self.reciente_id, 3)
        self._comprobar_promedio(3, 1)
        self._calificar(self.reciente_id, 5)
        self._comprobar_promedio(4, 2)

    def test_comentarios_sin_estrellas_no_alteran_promedio(self):
        self._calificar(self.reciente_id, 3)
        self._calificar(self.reciente_id, 5)
        padre = self.db.get(Resena, self.reciente_id)
        comentario = Resena(
            id=uuid4(), usuario_id=padre.usuario_id, contenido_id=1,
            resena_padre_id=padre.id, calificacion=None,
            texto="Solo texto", fecha=datetime.now(timezone.utc),
        )
        self.db.add(comentario)
        self.db.commit()
        self._comprobar_promedio(4, 2)
        self._comprobar_promedio(None, 0, comentario.id)

    def test_sin_valoraciones_promedio_es_null_y_cantidad_cero(self):
        self._comprobar_promedio(None, 0)

    def test_promedio_no_incluye_valoraciones_de_otras_resenas(self):
        self._calificar(self.reciente_id, 3)
        self._calificar(self.reciente_id, 5)
        self._calificar(self.antigua_id, 1)
        self._calificar(self.serie_id, 0.5)
        self._comprobar_promedio(4, 2)
        self._comprobar_promedio(1, 1, self.antigua_id)

    def test_editar_valoracion_recalcula_promedio_sin_aumentar_cantidad(self):
        self._calificar(self.reciente_id, 3)
        calificacion = self._calificar(self.reciente_id, 5)
        self._comprobar_promedio(4, 2)
        calificacion.calificacion = Decimal("1")
        self.db.commit()
        self._comprobar_promedio(2, 2)

    def test_promedio_conserva_decimales(self):
        self._calificar(self.reciente_id, 3)
        self._calificar(self.reciente_id, 4.5)
        self._comprobar_promedio(3.75, 2)

    def test_resenas_del_contenido_ordenadas_de_mas_nueva_a_mas_antigua(self):
        respuesta = self.client.get("/contenidos/pelicula/550/resenas")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        datos = respuesta.json()
        self.assertEqual(
            [resena["id"] for resena in datos],
            [str(self.reciente_id), str(self.antigua_id)],
        )
        self.assertEqual(datos[0]["autor"]["nombre_usuario"], "bea")
        self.assertEqual(datos[0]["contenido_tmdb_id"], 550)
        self.assertEqual(datos[0]["valoracion"], 1)
        self.assertEqual(datos[1]["valoracion"], -1)

    def test_resenas_de_serie_no_se_mezclan_con_pelicula_del_mismo_id(self):
        respuesta = self.client.get("/contenidos/serie/550/resenas")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(
            [resena["id"] for resena in respuesta.json()],
            [str(self.serie_id)],
        )

    def test_resena_sin_calificacion_se_devuelve_como_null(self):
        # La columna admite NULL en la base; una fila así no debe romper el listado.
        self.db.add(
            Resena(
                id=uuid4(),
                usuario_id=self.db.query(Usuario).first().id,
                contenido_id=1,
                resena_padre_id=self.reciente_id,
                plataforma_id=None,
                calificacion=None,
                texto="Respuesta sin nota",
                fecha=datetime.now(timezone.utc) + timedelta(days=3),
            )
        )
        self.db.commit()

        respuesta = self.client.get("/contenidos/pelicula/550/resenas")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertIsNone(respuesta.json()[0]["calificacion"])

    def test_contenido_sin_resenas_devuelve_lista_vacia(self):
        respuesta = self.client.get("/contenidos/serie/404/resenas")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json(), [])

    def test_tipo_o_id_invalido_devuelve_error_de_validacion(self):
        self.assertEqual(
            self.client.get("/contenidos/documental/550/resenas").status_code,
            422,
        )
        self.assertEqual(
            self.client.get("/contenidos/pelicula/0/resenas").status_code,
            422,
        )

    @patch("app.routers.contenidos.obtener_detalle_contenido")
    def test_ficha_de_pelicula(self, obtener_detalle):
        obtener_detalle.return_value = ContenidoDetalleRespuesta(
            tmdb_id=550,
            tipo="pelicula",
            titulo="El club de la pelea",
            titulo_original="Fight Club",
            sinopsis="Un oficinista conoce a Tyler Durden.",
            fecha_estreno="1999-10-15",
            poster_url="https://image.tmdb.org/t/p/w500/poster.jpg",
            portada_url=None,
            generos=[GeneroContenido(id=18, nombre="Drama")],
            duracion_minutos=139,
            cantidad_temporadas=None,
            calificacion_tmdb=8.4,
        )

        respuesta = self.client.get("/contenidos/pelicula/550")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["titulo"], "El club de la pelea")
        obtener_detalle.assert_called_once_with("pelicula", 550)

    @patch("app.routers.contenidos.obtener_generos_contenido")
    def test_endpoint_devuelve_generos_oficiales(self, obtener_generos):
        obtener_generos.return_value = (
            GeneroContenido(id=28, nombre="Acción"),
            GeneroContenido(id=18, nombre="Drama"),
        )

        respuesta = consultar_generos()

        self.assertEqual(
            [genero.model_dump() for genero in respuesta],
            [
                {"id": 28, "nombre": "Acción"},
                {"id": 18, "nombre": "Drama"},
            ],
        )

    @patch("app.services.contenido_service._consultar_lista_generos_tmdb")
    def test_combina_generos_de_peliculas_y_series_sin_repetirlos(self, consultar):
        consultar.side_effect = [
            [{"id": 18, "name": "Drama"}, {"id": 28, "name": "Acción"}],
            [{"id": 18, "name": "Drama"}, {"id": 10765, "name": "Sci-Fi"}],
        ]
        obtener_generos_contenido.cache_clear()
        self.addCleanup(obtener_generos_contenido.cache_clear)

        generos = obtener_generos_contenido()
        segunda_lectura = obtener_generos_contenido()

        self.assertEqual(
            [(genero.id, genero.nombre) for genero in generos],
            [(28, "Acción"), (18, "Drama"), (10765, "Sci-Fi")],
        )
        self.assertIs(segunda_lectura, generos)
        self.assertEqual(consultar.call_count, 2)

    @patch("app.services.contenido_service.obtener_generos_contenido")
    def test_valida_y_normaliza_generos_favoritos(self, obtener_generos):
        obtener_generos.return_value = (
            GeneroContenido(id=18, nombre="Drama"),
            GeneroContenido(id=35, nombre="Comedia"),
        )

        self.assertEqual(
            normalizar_generos_favoritos(["drama", "COMEDIA"]),
            ["Drama", "Comedia"],
        )
        with self.assertRaisesRegex(
            GeneroFavoritoInvalidoError, "Género favorito inexistente: kkk"
        ):
            normalizar_generos_favoritos(["Drama", "kkk"])

    @patch("app.routers.contenidos.obtener_detalle_contenido")
    def test_ficha_inexistente_devuelve_404(self, obtener_detalle):
        obtener_detalle.side_effect = ContenidoNoEncontradoError(
            "Contenido no encontrado"
        )

        respuesta = self.client.get("/contenidos/serie/999999")

        self.assertEqual(respuesta.status_code, 404)
        self.assertEqual(respuesta.json()["detail"], "Contenido no encontrado")

    @patch("app.routers.contenidos.obtener_detalle_contenido")
    def test_error_del_catalogo_devuelve_502(self, obtener_detalle):
        obtener_detalle.side_effect = CatalogoNoDisponibleError(
            "No fue posible consultar el catálogo"
        )

        respuesta = self.client.get("/contenidos/pelicula/550")

        self.assertEqual(respuesta.status_code, 502)

    @patch("app.services.contenido_service._consultar_tmdb")
    def test_adapta_una_serie_de_tmdb(self, consultar_tmdb):
        consultar_tmdb.return_value = {
            "id": 1399,
            "name": "Juego de tronos",
            "original_name": "Game of Thrones",
            "overview": "Nueve familias disputan el poder.",
            "first_air_date": "2011-04-17",
            "poster_path": "/poster.jpg",
            "backdrop_path": "/portada.jpg",
            "genres": [{"id": 18, "name": "Drama"}],
            "episode_run_time": [60],
            "number_of_seasons": 8,
            "vote_average": 8.5,
        }

        contenido = obtener_detalle_contenido("serie", 1399)

        consultar_tmdb.assert_called_once_with("tv", 1399)
        self.assertEqual(contenido.titulo, "Juego de tronos")
        self.assertEqual(contenido.duracion_minutos, 60)
        self.assertEqual(contenido.cantidad_temporadas, 8)
        self.assertEqual(
            contenido.poster_url,
            "https://image.tmdb.org/t/p/w500/poster.jpg",
        )

    def test_catalogo_sin_token_informa_que_no_esta_configurado(self):
        with patch.object(settings, "tmdb_access_token", ""):
            with self.assertRaisesRegex(
                CatalogoNoDisponibleError, "catálogo no está configurado"
            ):
                _consultar_tmdb("movie", 550)

    @patch("app.core.tmdb._solicitar")
    def test_consulta_tmdb_con_token_y_devuelve_json(self, get):
        respuesta = get.return_value
        respuesta.status_code = 200
        respuesta.json.return_value = {"id": 550, "title": "Fight Club"}

        with patch.object(settings, "tmdb_access_token", "token-de-prueba"):
            datos = _consultar_tmdb("movie", 550)

        self.assertEqual(datos["id"], 550)
        get.assert_called_once_with(
            f"{settings.tmdb_api_url}/movie/550",
            headers={
                "Accept": "application/json",
                "Authorization": "Bearer token-de-prueba",
            },
            params={"language": "es-MX"},
        )
        respuesta.raise_for_status.assert_called_once_with()

    @patch("app.core.tmdb._solicitar")
    def test_consulta_tmdb_traduce_error_de_red(self, get):
        get.side_effect = httpx.ConnectError("Sin conexión")

        with patch.object(settings, "tmdb_access_token", "token-de-prueba"):
            with self.assertRaisesRegex(
                CatalogoNoDisponibleError, "consultar el catálogo"
            ):
                _consultar_tmdb("tv", 1399)

    @patch("app.core.tmdb._solicitar")
    def test_consulta_tmdb_traduce_404(self, get):
        get.return_value.status_code = 404
        get.return_value.raise_for_status.side_effect = httpx.HTTPStatusError(
            "No encontrado", request=httpx.Request("GET", "https://api.themoviedb.org"),
            response=httpx.Response(404),
        )

        with patch.object(settings, "tmdb_access_token", "token-de-prueba"):
            with self.assertRaisesRegex(
                ContenidoNoEncontradoError, "Contenido no encontrado"
            ):
                _consultar_tmdb("movie", 999999)

        get.return_value.raise_for_status.assert_called_once()

    @patch("app.core.tmdb._solicitar")
    def test_consulta_tmdb_traduce_error_http(self, get):
        respuesta = get.return_value
        respuesta.status_code = 503
        respuesta.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Servicio no disponible",
            request=httpx.Request("GET", "https://api.themoviedb.org"),
            response=httpx.Response(503),
        )

        with patch.object(settings, "tmdb_access_token", "token-de-prueba"):
            with self.assertRaisesRegex(
                CatalogoNoDisponibleError, "consultar el catálogo"
            ):
                _consultar_tmdb("movie", 550)

    def test_url_de_imagen_ausente_permanece_ausente(self):
        self.assertIsNone(_url_imagen(None, "w500"))


if __name__ == "__main__":
    unittest.main()
