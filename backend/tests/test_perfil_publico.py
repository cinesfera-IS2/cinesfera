import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from app.models.contenido import Contenido
from app.models.resena import Resena, ValoracionResena
from app.models.usuario import Usuario
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class PerfilPublicoTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, ValoracionResena
        )
        ahora = datetime.now(timezone.utc)
        self.db.add(Contenido(id=1, tmdb_id=42, tipo="pelicula"))
        self.usuario_id = crear_usuario(
            self.db, "ana", nombre="Ana", password_hash="secreto",
            foto_url="https://example.com/foto.jpg"
        ).id
        otro_id = crear_usuario(
            self.db, "bea", nombre="Bea", password_hash="secreto",
            foto_url="https://example.com/foto.jpg"
        ).id
        antigua_id, reciente_id, ajena_id = uuid4(), uuid4(), uuid4()
        for id_, autor, fecha in (
            (antigua_id, self.usuario_id, ahora - timedelta(days=2)),
            (reciente_id, self.usuario_id, ahora),
            (ajena_id, otro_id, ahora + timedelta(days=1))
        ):
            self.db.add(Resena(
                id=id_, usuario_id=autor, contenido_id=1,
                plataforma_id=None, calificacion=Decimal("4.5"),
                texto="Una reseña", fecha=fecha
            ))
        self.db.flush()
        self.db.add_all([
            ValoracionResena(usuario_id=otro_id, resena_id=antigua_id, valor=1),
            ValoracionResena(usuario_id=self.usuario_id, resena_id=reciente_id, valor=-1),
            ValoracionResena(usuario_id=self.usuario_id, resena_id=ajena_id, valor=1)
        ])
        self.db.commit()
        self.client = conectar_api(self, self.db)
        self.antigua_id, self.reciente_id = antigua_id, reciente_id

    def test_datos_publicos_resenas_ordenadas_y_reputacion(self):
        respuesta = self.client.get(f"/usuarios/{self.usuario_id}/perfil-publico")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        datos = respuesta.json()
        self.assertEqual(datos["nombre"], "Ana")
        self.assertEqual(datos["foto_url"], "https://example.com/foto.jpg")
        self.assertEqual(datos["reputacion"], 0)
        self.assertEqual(
            [resena["id"] for resena in datos["resenas"]],
            [str(self.reciente_id), str(self.antigua_id)]
        )
        self.assertEqual(datos["resenas"][0]["calificacion"], 4.5)
        self.assertEqual(datos["resenas"][0]["contenido_tmdb_id"], 42)
        self.assertNotIn("email", datos)
        self.assertNotIn("password_hash", datos)

    def test_usuario_inexistente(self):
        respuesta = self.client.get(f"/usuarios/{uuid4()}/perfil-publico")
        self.assertEqual(respuesta.status_code, 404)

    def test_busqueda_por_nombre_de_usuario(self):
        respuesta = self.client.get(
            "/usuarios/por-nombre/ANA/perfil-publico"
        )
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["id"], str(self.usuario_id))
        self.assertEqual(len(respuesta.json()["resenas"]), 2)
        self.assertNotIn("email", respuesta.json())

        inexistente = self.client.get(
            "/usuarios/por-nombre/desconocida/perfil-publico"
        )
        self.assertEqual(inexistente.status_code, 404)


if __name__ == "__main__":
    unittest.main()
