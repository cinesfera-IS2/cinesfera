import unittest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from sqlalchemy import func, select

from app.core import security
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena
from app.models.usuario import Usuario
from app.services.contenido_service import ContenidoNoEncontradoError
from tests.utilidades import (
    configurar_jwt,
    conectar_api,
    crear_base_en_memoria,
    crear_usuario,
)


class CrearResenaTests(unittest.TestCase):
    def setUp(self):
        configurar_jwt(self)
        self.db = crear_base_en_memoria(self, Usuario, Contenido, Resena, CalificacionResena)
        self.contenido = Contenido(
            id=1,
            tmdb_id=550,
            tipo="pelicula",
            temporada=None,
            episodio=None,
            titulo="El club de la pelea",
        )
        self.db.add(self.contenido)
        self.db.commit()
        self.usuario = crear_usuario(self.db, "critica")
        self.otro_usuario = crear_usuario(self.db, "otra-persona")
        self.client = conectar_api(self, self.db)
        self.headers = {
            "Authorization": (
                f"Bearer {security.generar_token_acceso(self.usuario.id)}"
            )
        }
        self.datos = {
            "usuario_id": str(self.usuario.id),
            "texto": "Una película inolvidable",
            "calificacion": 4.5,
            "plataforma_id": 2,
        }

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_publica_resena_y_la_asocia_al_usuario_autenticado(self, detalle):
        respuesta = self.client.post(
            "/contenidos/pelicula/550/resenas",
            json=self.datos,
            headers=self.headers,
        )

        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        cuerpo = respuesta.json()
        self.assertEqual(cuerpo["mensaje"], "Reseña publicada correctamente")
        self.assertEqual(cuerpo["usuario_id"], str(self.usuario.id))
        self.assertEqual(cuerpo["contenido_tmdb_id"], 550)
        self.assertIsNone(cuerpo["resena_padre_id"])

        guardada = self.db.scalar(select(Resena))
        self.assertEqual(guardada.usuario_id, self.usuario.id)
        self.assertEqual(guardada.contenido_id, self.contenido.id)
        self.assertEqual(guardada.texto, self.datos["texto"])
        self.assertEqual(guardada.calificacion, Decimal("4.5000000000"))
        detalle.assert_called_once_with("pelicula", 550)

    def test_rechaza_publicacion_sin_sesion(self):
        respuesta = self.client.post(
            "/contenidos/pelicula/550/resenas",
            json=self.datos,
        )

        self.assertEqual(respuesta.status_code, 401)
        self.assertEqual(respuesta.json()["detail"], "No hay una sesión activa")
        self.assertEqual(self._cantidad_resenas(), 0)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_contenido_inexistente_no_almacena_resena(self, detalle):
        detalle.side_effect = ContenidoNoEncontradoError(
            "Contenido no encontrado"
        )

        respuesta = self.client.post(
            "/contenidos/serie/999999/resenas",
            json=self.datos,
            headers=self.headers,
        )

        self.assertEqual(respuesta.status_code, 404)
        self.assertEqual(respuesta.json()["detail"], "Contenido no encontrado")
        self.assertEqual(self._cantidad_resenas(), 0)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_guarda_respuesta_a_una_resena_del_mismo_contenido(self, _detalle):
        padre = Resena(
            id=uuid4(),
            usuario_id=self.otro_usuario.id,
            contenido_id=self.contenido.id,
            resena_padre_id=None,
            plataforma_id=None,
            calificacion=Decimal("5"),
            texto="Reseña original",
            fecha=datetime.now(timezone.utc),
        )
        self.db.add(padre)
        self.db.commit()
        datos = {**self.datos, "resena_padre_id": str(padre.id)}

        respuesta = self.client.post(
            "/contenidos/pelicula/550/resenas",
            json=datos,
            headers=self.headers,
        )

        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(respuesta.json()["resena_padre_id"], str(padre.id))
        hija = self.db.scalar(
            select(Resena).where(Resena.resena_padre_id == padre.id)
        )
        self.assertIsNotNone(hija)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_no_permite_publicar_por_otro_usuario(self, detalle):
        datos = {**self.datos, "usuario_id": str(self.otro_usuario.id)}

        respuesta = self.client.post(
            "/contenidos/pelicula/550/resenas",
            json=datos,
            headers=self.headers,
        )

        self.assertEqual(respuesta.status_code, 403)
        self.assertEqual(self._cantidad_resenas(), 0)
        detalle.assert_not_called()

    def _padre(self, autor=None, respuesta_a=None):
        resena = Resena(
            id=uuid4(), usuario_id=autor or self.otro_usuario.id,
            contenido_id=self.contenido.id, resena_padre_id=respuesta_a,
            calificacion=Decimal("5") if respuesta_a is None else None,
            texto="Comentario de prueba", fecha=datetime.now(timezone.utc),
        )
        self.db.add(resena)
        self.db.commit()
        return resena

    def _publicar(self, padre, **campos):
        return self.client.post(
            "/contenidos/pelicula/550/resenas",
            json={**self.datos, "resena_padre_id": str(padre.id), **campos},
            headers=self.headers,
        )

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_valoracion_unica_y_comentarios_posteriores(self, _detalle):
        padre = self._padre()
        primera = self._publicar(padre)
        self.assertEqual(primera.status_code, 201, primera.text)
        valoracion = self.db.get(CalificacionResena, (self.usuario.id, padre.id))
        self.assertEqual(valoracion.calificacion, Decimal("4.5"))
        duplicada = self._publicar(padre, calificacion=2)
        self.assertEqual(duplicada.status_code, 409, duplicada.text)
        self.assertEqual(self._cantidad_resenas(), 2)
        comentario = self._publicar(padre, calificacion=None)
        self.assertEqual(comentario.status_code, 201, comentario.text)
        self.assertIsNone(comentario.json()["calificacion"])
        self.db.refresh(valoracion)
        self.assertEqual(valoracion.calificacion, Decimal("4.5"))
        self.assertEqual(self._cantidad_resenas(), 3)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_respuestas_anidadas_solo_sin_estrellas(self, _detalle):
        padre = self._padre()
        comentario = self._padre(respuesta_a=padre.id)
        for destino in (comentario, self._padre(respuesta_a=comentario.id)):
            rechazo = self._publicar(destino)
            self.assertEqual(rechazo.status_code, 422, rechazo.text)
            respuesta = self._publicar(destino, calificacion=None)
            self.assertEqual(respuesta.status_code, 201, respuesta.text)
            self.assertEqual(respuesta.json()["resena_padre_id"], str(destino.id))
        self.assertEqual(self.db.scalar(select(func.count()).select_from(CalificacionResena)), 0)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_autovaloracion_no_crea_comentario_ni_estrellas(self, _detalle):
        padre = self._padre(autor=self.usuario.id)
        respuesta = self._publicar(padre)
        self.assertEqual(respuesta.status_code, 422, respuesta.text)
        self.assertEqual(self._cantidad_resenas(), 1)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(CalificacionResena)), 0)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_conflicto_en_insert_tras_consulta_sin_resultado_revierte_comentario(self, _detalle):
        padre = self._padre()
        self.assertEqual(self._publicar(padre).status_code, 201)
        obtener = self.db.get
        primera_consulta = True

        def consulta(modelo, clave, **kwargs):
            nonlocal primera_consulta
            if modelo is CalificacionResena and primera_consulta:
                primera_consulta = False
                return None  # Otra solicitud insertó después de nuestra lectura.
            return obtener(modelo, clave, **kwargs)

        with patch.object(self.db, "get", side_effect=consulta):
            respuesta = self._publicar(padre, calificacion=1)
        self.assertEqual(respuesta.status_code, 409, respuesta.text)
        self.assertEqual(self._cantidad_resenas(), 2)
        self.assertEqual(obtener(CalificacionResena, (self.usuario.id, padre.id)).calificacion, Decimal("4.5"))
        self.assertEqual(self._publicar(padre, calificacion=None).status_code, 201)

    @patch("app.services.contenido_service.obtener_detalle_contenido")
    def test_estrellas_invalidas_y_texto_vacio_no_persisten(self, _detalle):
        padre = self._padre()
        for calificacion in (0, 0.2, 1.2, 5.5, -1):
            respuesta = self._publicar(padre, calificacion=calificacion)
            self.assertEqual(respuesta.status_code, 422, respuesta.text)
        self.assertEqual(self._publicar(padre, texto="   ").status_code, 422)
        self.assertEqual(self._cantidad_resenas(), 1)

    def _cantidad_resenas(self) -> int:
        return self.db.scalar(select(func.count()).select_from(Resena))


if __name__ == "__main__":
    unittest.main()
