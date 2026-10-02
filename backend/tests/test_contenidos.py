import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from app.models.resena import Resena, ValoracionResena
from app.models.usuario import Usuario
from app.schemas.contenido import ContenidoDetalleRespuesta, GeneroContenido
from app.services.contenido_service import (
    CatalogoNoDisponibleError,
    ContenidoNoEncontradoError,
    obtener_detalle_contenido,
)
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class ContenidosTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(self, Usuario, Resena, ValoracionResena)
        ahora = datetime.now(timezone.utc)
        ana = crear_usuario(self.db, "ana", nombre="Ana", apellido="Pérez")
        bea = crear_usuario(self.db, "bea", nombre="Bea", apellido="Silva")
        self.reciente_id = uuid4()
        self.antigua_id = uuid4()
        ajena_id = uuid4()

        self.db.add_all([
            Resena(
                id=self.antigua_id,
                usuario_id=ana.id,
                contenido_tmdb_id=550,
                plataforma_id=None,
                calificacion=Decimal("4.0"),
                texto="La primera reseña",
                fecha=ahora - timedelta(days=2),
            ),
            Resena(
                id=self.reciente_id,
                usuario_id=bea.id,
                contenido_tmdb_id=550,
                plataforma_id=3,
                calificacion=Decimal("4.5"),
                texto="La reseña más reciente",
                fecha=ahora,
            ),
            Resena(
                id=ajena_id,
                usuario_id=ana.id,
                contenido_tmdb_id=999,
                plataforma_id=None,
                calificacion=Decimal("2.0"),
                texto="Pertenece a otro contenido",
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

    def test_resenas_del_contenido_ordenadas_de_mas_nueva_a_mas_antigua(self):
        respuesta = self.client.get("/contenidos/pelicula/550/resenas")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        datos = respuesta.json()
        self.assertEqual(
            [resena["id"] for resena in datos],
            [str(self.reciente_id), str(self.antigua_id)],
        )
        self.assertEqual(datos[0]["autor"]["nombre_usuario"], "bea")
        self.assertEqual(datos[0]["valoracion"], 1)
        self.assertEqual(datos[1]["valoracion"], -1)

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


if __name__ == "__main__":
    unittest.main()
