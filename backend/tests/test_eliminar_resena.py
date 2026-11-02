import unittest
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from app.core import security
from app.core.enums import EstadoResena, RolUsuario
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena, ValoracionResena
from app.models.usuario import Usuario
from app.services.contenido_service import eliminar_resena
from app.services.reputacion_service import recalcular_reputacion
from tests.utilidades import configurar_jwt, conectar_api, crear_base_en_memoria, crear_usuario


class EliminarResenaTests(unittest.TestCase):
    def setUp(self):
        configurar_jwt(self)
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, ValoracionResena, CalificacionResena
        )
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
        self.autor = crear_usuario(self.db, "autor")
        self.otro_usuario = crear_usuario(self.db, "otra-persona")
        self.admin = crear_usuario(self.db, "admin", rol=RolUsuario.ADMIN)
        self.client = conectar_api(self, self.db)

    def _crear_resena(self, autor=None):
        resena = Resena(
            id=uuid4(),
            usuario_id=(autor or self.autor).id,
            contenido_id=self.contenido.id,
            resena_padre_id=None,
            plataforma_id=None,
            calificacion=Decimal("4.5"),
            texto="Reseña para eliminar",
            fecha=datetime.now(timezone.utc),
        )
        self.db.add(resena)
        self.db.commit()
        return resena

    def _headers(self, usuario):
        return {"Authorization": f"Bearer {security.generar_token_acceso(usuario.id)}"}

    def _borrar(self, resena, usuario, *, tmdb_id=550):
        return self.client.delete(
            f"/contenidos/pelicula/{tmdb_id}/resenas/{resena.id}",
            headers=self._headers(usuario),
        )

    def test_administrador_puede_eliminar_cualquier_resena(self):
        resena = self._crear_resena()

        respuesta = self._borrar(resena, self.admin)

        self.assertEqual(respuesta.status_code, 204, respuesta.text)
        self.db.refresh(resena)
        self.assertEqual(resena.estado, EstadoResena.ELIMINADA)

    def test_usuario_puede_eliminar_su_propia_resena(self):
        resena = self._crear_resena()

        respuesta = self._borrar(resena, self.autor)

        self.assertEqual(respuesta.status_code, 204, respuesta.text)
        self.db.refresh(resena)
        self.assertEqual(resena.estado, EstadoResena.ELIMINADA)

    def test_eliminar_resena_padre_elimina_respuestas_y_calificaciones(self):
        resena = self._crear_resena()
        comentario = Resena(
            id=uuid4(), usuario_id=self.otro_usuario.id,
            contenido_id=self.contenido.id, resena_padre_id=resena.id,
            plataforma_id=None, calificacion=Decimal("4.5"),
            texto="Comentario de otra persona", fecha=datetime.now(timezone.utc),
        )
        respuesta = Resena(
            id=uuid4(), usuario_id=self.admin.id,
            contenido_id=self.contenido.id, resena_padre_id=comentario.id,
            plataforma_id=None, calificacion=None,
            texto="Respuesta al comentario", fecha=datetime.now(timezone.utc),
        )
        calificacion = CalificacionResena(
            usuario_id=self.otro_usuario.id,
            resena_id=resena.id,
            calificacion=Decimal("4.5"),
            fecha_actualizacion=datetime.now(timezone.utc),
        )
        self.db.add_all([comentario, respuesta, calificacion])
        self.db.flush()
        recalcular_reputacion(self.db, self.autor.id)
        self.db.commit()
        self.assertEqual(self.autor.reputacion, Decimal("4.50"))

        eliminar_resena(
            self.db, "pelicula", self.contenido.tmdb_id, resena.id, self.autor
        )

        self.assertIsNone(
            self.db.get(CalificacionResena, (self.otro_usuario.id, resena.id))
        )
        self.assertEqual(comentario.estado, EstadoResena.ELIMINADA)
        self.assertEqual(respuesta.estado, EstadoResena.ELIMINADA)
        self.assertEqual(self.autor.reputacion, Decimal("0.00"))

    def test_usuario_no_puede_eliminar_una_resena_ajena(self):
        resena = self._crear_resena()

        respuesta = self._borrar(resena, self.otro_usuario)

        self.assertEqual(respuesta.status_code, 403, respuesta.text)
        self.assertEqual(
            respuesta.json()["detail"], "Solo podés eliminar tus propias reseñas"
        )
        self.db.refresh(resena)
        self.assertEqual(resena.estado, EstadoResena.VISIBLE)

    def test_no_elimina_resena_desde_una_pelicula_distinta(self):
        resena = self._crear_resena()

        respuesta = self._borrar(resena, self.admin, tmdb_id=999)

        self.assertEqual(respuesta.status_code, 404, respuesta.text)
        self.db.refresh(resena)
        self.assertEqual(resena.estado, EstadoResena.VISIBLE)


if __name__ == "__main__":
    unittest.main()
