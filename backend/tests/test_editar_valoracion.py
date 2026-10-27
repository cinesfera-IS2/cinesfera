import unittest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError

from app.core import security
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena, ValoracionResena
from app.models.usuario import Usuario
from app.schemas.contenido import CalificacionActualizacion
from app.services.contenido_service import actualizar_calificacion
from tests.utilidades import configurar_jwt, conectar_api, crear_base_en_memoria, crear_usuario


class EditarValoracionTests(unittest.TestCase):
    def setUp(self):
        configurar_jwt(self)
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, CalificacionResena, ValoracionResena,
        )
        self.usuario = crear_usuario(self.db, "critica")
        self.otro = crear_usuario(self.db, "otra")
        self.autor = crear_usuario(self.db, "autor")
        self.db.add(Contenido(id=1, tmdb_id=550, tipo="pelicula"))
        self.padre = Resena(
            id=uuid4(), usuario_id=self.autor.id, contenido_id=1,
            calificacion=Decimal("4.5"), texto="Reseña padre",
            fecha=datetime.now(timezone.utc),
        )
        self.comentario = Resena(
            id=uuid4(), usuario_id=self.usuario.id, contenido_id=1,
            resena_padre_id=self.padre.id, calificacion=Decimal("5"),
            texto="Mi comentario original", fecha=datetime.now(timezone.utc),
        )
        self.db.add_all([self.padre, self.comentario])
        self.valoracion = CalificacionResena(
            usuario_id=self.usuario.id, resena_id=self.padre.id,
            calificacion=Decimal("5"), fecha_actualizacion=datetime.now(timezone.utc),
        )
        self.db.add_all([
            self.valoracion,
            CalificacionResena(
                usuario_id=self.otro.id, resena_id=self.padre.id,
                calificacion=Decimal("3"), fecha_actualizacion=datetime.now(timezone.utc),
            ),
        ])
        self.db.commit()
        self.client = conectar_api(self, self.db)
        self.ruta = f"/contenidos/pelicula/550/resenas/{self.padre.id}/valoracion"
        self.headers = self._headers(self.usuario)

    def _headers(self, usuario):
        return {"Authorization": f"Bearer {security.generar_token_acceso(usuario.id)}"}

    def test_actualiza_promedio_sin_duplicar_ni_cambiar_comentario(self):
        fecha = self.comentario.fecha
        respuesta = self.client.patch(self.ruta, json={"calificacion": 1}, headers=self.headers)
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json(), {
            "resena_id": str(self.padre.id), "calificacion": 1,
            "promedio_comunitario": 2, "cantidad_valoraciones": 2,
        })
        self.assertEqual(self.db.scalar(select(func.count()).select_from(CalificacionResena)), 2)
        self.assertEqual(self.db.scalar(select(func.count()).select_from(Resena)), 2)
        self.db.refresh(self.comentario)
        self.assertEqual(self.comentario.texto, "Mi comentario original")
        self.assertEqual(self.comentario.fecha, fecha)
        self.assertEqual(self.comentario.calificacion, Decimal("5"))
        self.db.refresh(self.padre)
        self.assertEqual(self.padre.calificacion, Decimal("4.5"))
        listado = self.client.get("/contenidos/pelicula/550/resenas").json()
        padre = next(fila for fila in listado if fila["id"] == str(self.padre.id))
        self.assertEqual(padre["promedio_comunitario"], 2)
        self.assertEqual(padre["cantidad_valoraciones"], 2)

    def test_edita_dos_a_cuatro_y_media_y_consulta_el_valor_vigente(self):
        for puntaje in (2, 4.5):
            respuesta = self.client.patch(self.ruta, json={"calificacion": puntaje}, headers=self.headers)
            self.assertEqual(respuesta.status_code, 200, respuesta.text)
        propias = self.client.get("/contenidos/pelicula/550/valoraciones/mias", headers=self.headers)
        self.assertEqual(propias.status_code, 200, propias.text)
        self.assertEqual(propias.json(), [{"resena_id": str(self.padre.id), "calificacion": 4.5}])
        self.assertEqual(self.db.scalar(select(func.count()).select_from(CalificacionResena)), 2)

    def test_no_permite_modificar_valoracion_ajena(self):
        # Este usuario no valoró la reseña: no puede editar las filas de otros.
        respuesta = self.client.patch(self.ruta, json={"calificacion": 1}, headers=self._headers(self.autor))
        self.assertEqual(respuesta.status_code, 403, respuesta.text)
        self.db.refresh(self.valoracion)
        self.assertEqual(self.valoracion.calificacion, Decimal("5"))

    def test_no_acepta_usuario_ajeno_ni_comentario_en_el_cuerpo(self):
        for campos in ({"usuario_id": str(self.otro.id)}, {"texto": "Reemplazo"}):
            respuesta = self.client.patch(self.ruta, json={"calificacion": 1, **campos}, headers=self.headers)
            self.assertEqual(respuesta.status_code, 422, respuesta.text)
        self.db.refresh(self.valoracion)
        self.assertEqual(self.valoracion.calificacion, Decimal("5"))

    def test_rechaza_puntajes_invalidos(self):
        for puntaje in (0, -1, 5.5, 2.3, None, "abc"):
            with self.subTest(puntaje=puntaje):
                respuesta = self.client.patch(self.ruta, json={"calificacion": puntaje}, headers=self.headers)
                self.assertEqual(respuesta.status_code, 422, respuesta.text)
        self.db.refresh(self.valoracion)
        self.assertEqual(self.valoracion.calificacion, Decimal("5"))

    def test_requiere_autenticacion_para_leer_y_editar(self):
        self.assertEqual(self.client.patch(self.ruta, json={"calificacion": 1}).status_code, 401)
        self.assertEqual(self.client.get("/contenidos/pelicula/550/valoraciones/mias").status_code, 401)

    def test_valida_padre_y_contenido(self):
        for ruta in (
            self.ruta.replace(str(self.padre.id), str(uuid4())),
            self.ruta.replace(str(self.padre.id), str(self.comentario.id)),
            self.ruta.replace("/550/", "/999/"),
            self.ruta.replace("/pelicula/", "/serie/"),
        ):
            with self.subTest(ruta=ruta):
                respuesta = self.client.patch(ruta, json={"calificacion": 1}, headers=self.headers)
                self.assertEqual(respuesta.status_code, 404, respuesta.text)

    def test_consulta_solo_valoraciones_del_usuario_y_contenido(self):
        for tipo, tmdb_id in (("serie", 550), ("pelicula", 999)):
            respuesta = self.client.get(f"/contenidos/{tipo}/{tmdb_id}/valoraciones/mias", headers=self.headers)
            self.assertEqual(respuesta.json(), [])
        respuesta = self.client.get("/contenidos/pelicula/550/valoraciones/mias", headers=self._headers(self.otro))
        self.assertEqual(respuesta.json(), [{"resena_id": str(self.padre.id), "calificacion": 3}])

    def test_error_al_confirmar_revierte_y_permite_reintentar(self):
        with patch.object(self.db, "commit", side_effect=SQLAlchemyError("Error de prueba")):
            with self.assertRaises(SQLAlchemyError):
                actualizar_calificacion(
                    self.db, "pelicula", 550, self.padre.id, self.usuario.id,
                    CalificacionActualizacion(calificacion=1),
                )
        self.db.refresh(self.valoracion)
        self.assertEqual(self.valoracion.calificacion, Decimal("5"))
        respuesta = self.client.patch(self.ruta, json={"calificacion": 4.5}, headers=self.headers)
        self.assertEqual(respuesta.status_code, 200, respuesta.text)

    def test_sesion_cookie_exige_csrf(self):
        token = security.generar_token_acceso(self.usuario.id)
        self.client.cookies.set("access_token", token)
        respuesta = self.client.patch(self.ruta, json={"calificacion": 1})
        self.assertEqual(respuesta.status_code, 403, respuesta.text)
        csrf = self.client.get("/auth/csrf").json()["csrf_token"]
        respuesta = self.client.patch(self.ruta, json={"calificacion": 1}, headers={"X-CSRF-Token": csrf})
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
