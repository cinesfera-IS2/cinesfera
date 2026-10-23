import unittest
from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.main import app
from app.models.seguimiento import Seguimiento
from app.models.usuario import Usuario
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class SeguimientosTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(self, Usuario, Seguimiento)
        self.ana = crear_usuario(self.db, "ana", nombre="Ana")
        self.bea = crear_usuario(self.db, "bea", nombre="Bea")
        self.carla = crear_usuario(self.db, "carla", nombre="Carla")
        self.client = conectar_api(self, self.db)
        app.dependency_overrides[obtener_usuario_actual] = lambda: self.ana

    def actuar_como(self, usuario: Usuario):
        app.dependency_overrides[obtener_usuario_actual] = lambda: usuario

    def seguir(self, usuario: Usuario):
        return self.client.post(f"/usuarios/{usuario.id}/seguir")

    def crear_seguimiento(self, seguidor: Usuario, seguido: Usuario):
        seguimiento = Seguimiento(
            seguidor_id=seguidor.id,
            seguido_id=seguido.id,
            fecha_seguimiento=datetime.now(timezone.utc)
        )
        self.db.add(seguimiento)
        self.db.commit()
        return seguimiento

    def test_seguimiento_mutuo_convierte_a_los_usuarios_en_amigos(self):
        respuesta = self.seguir(self.bea)

        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertFalse(respuesta.json()["son_amigos"])

        estado = self.client.get(
            f"/usuarios/{self.bea.id}/seguimiento"
        ).json()
        self.assertEqual(estado, {
            "siguiendo": True,
            "te_sigue": False,
            "son_amigos": False
        })

        self.actuar_como(self.bea)
        respuesta = self.seguir(self.ana)

        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertTrue(respuesta.json()["son_amigos"])
        estado = self.client.get(
            f"/usuarios/{self.ana.id}/seguimiento"
        ).json()
        self.assertEqual(estado, {
            "siguiendo": True,
            "te_sigue": True,
            "son_amigos": True
        })

    def test_listas_distinguen_seguidores_seguidos_y_amigos(self):
        self.crear_seguimiento(self.ana, self.bea)
        self.crear_seguimiento(self.bea, self.ana)
        self.crear_seguimiento(self.carla, self.ana)

        seguidores = self.client.get(
            f"/usuarios/{self.ana.id}/seguidores"
        )
        seguidos = self.client.get(
            f"/usuarios/{self.ana.id}/seguidos"
        )
        amigos = self.client.get(
            f"/usuarios/{self.ana.id}/amigos"
        )

        self.assertEqual(seguidores.status_code, 200, seguidores.text)
        self.assertEqual(
            [usuario["nombre_usuario"] for usuario in seguidores.json()],
            ["bea", "carla"]
        )
        self.assertEqual(
            [usuario["nombre_usuario"] for usuario in seguidos.json()],
            ["bea"]
        )
        self.assertEqual(
            [usuario["nombre_usuario"] for usuario in amigos.json()],
            ["bea"]
        )

    def test_cada_usuario_solo_puede_listar_sus_propios_amigos(self):
        self.crear_seguimiento(self.ana, self.bea)
        self.crear_seguimiento(self.bea, self.ana)

        respuesta = self.client.get(
            f"/usuarios/{self.bea.id}/amigos"
        )

        self.assertEqual(respuesta.status_code, 403, respuesta.text)
        self.assertEqual(
            respuesta.json()["detail"],
            "No tiene permiso para consultar estos amigos"
        )

    def test_listar_amigos_requiere_una_sesion(self):
        app.dependency_overrides.pop(obtener_usuario_actual)

        respuesta = self.client.get(
            f"/usuarios/{self.ana.id}/amigos"
        )

        self.assertEqual(respuesta.status_code, 401, respuesta.text)

    def test_dejar_de_seguir_rompe_la_amistad_pero_conserva_el_inverso(self):
        self.crear_seguimiento(self.ana, self.bea)
        self.crear_seguimiento(self.bea, self.ana)

        respuesta = self.client.delete(
            f"/usuarios/{self.bea.id}/seguir"
        )

        self.assertEqual(respuesta.status_code, 204, respuesta.text)
        self.assertIsNone(
            self.db.get(Seguimiento, (self.ana.id, self.bea.id))
        )
        self.assertIsNotNone(
            self.db.get(Seguimiento, (self.bea.id, self.ana.id))
        )
        estado = self.client.get(
            f"/usuarios/{self.bea.id}/seguimiento"
        ).json()
        self.assertEqual(estado, {
            "siguiendo": False,
            "te_sigue": True,
            "son_amigos": False
        })

    def test_valida_autoseguimiento_duplicados_y_usuarios_inexistentes(self):
        self.assertEqual(self.seguir(self.ana).status_code, 400)
        self.assertEqual(
            self.client.post(f"/usuarios/{uuid4()}/seguir").status_code,
            404
        )
        self.assertEqual(self.seguir(self.bea).status_code, 201)
        duplicado = self.seguir(self.bea)
        self.assertEqual(duplicado.status_code, 409, duplicado.text)
        self.assertEqual(
            duplicado.json()["detail"],
            "Ya sigue a este usuario"
        )

    def test_dejar_de_seguir_una_relacion_inexistente_responde_404(self):
        respuesta = self.client.delete(
            f"/usuarios/{self.bea.id}/seguir"
        )

        self.assertEqual(respuesta.status_code, 404, respuesta.text)
        self.assertEqual(
            respuesta.json()["detail"],
            "No sigue a este usuario"
        )


if __name__ == "__main__":
    unittest.main()
