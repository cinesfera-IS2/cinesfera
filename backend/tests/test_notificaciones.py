import unittest

from fastapi import HTTPException
from sqlalchemy import func, select

from app.core.enums import EstadoUsuario
from app.models.notificacion import Notificacion
from app.models.seguimiento import Seguimiento
from app.models.usuario import Usuario
from app.routers.notificaciones import (
    listar_notificaciones,
    marcar_como_leida,
    marcar_todas_como_leidas,
)
from app.routers.seguimientos import seguir_usuario
from tests.utilidades import crear_base_en_memoria, crear_usuario


class NotificacionesTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(
            self, Usuario, Seguimiento, Notificacion
        )
        self.ana = crear_usuario(self.db, "ana", nombre="Ana")
        self.bea = crear_usuario(self.db, "bea", nombre="Bea")

    def seguir(self):
        return seguir_usuario(self.bea.id, self.db, self.ana)

    def test_seguir_crea_una_notificacion_para_el_usuario_seguido(self):
        self.seguir()

        notificacion = self.db.scalar(select(Notificacion))
        self.assertIsNotNone(notificacion)
        self.assertEqual(notificacion.usuario_id, self.bea.id)
        self.assertEqual(notificacion.actor_id, self.ana.id)
        self.assertEqual(notificacion.tipo, "nuevo_seguidor")
        self.assertFalse(notificacion.leida)

        bandeja = listar_notificaciones(self.db, self.bea, 20)
        self.assertEqual(bandeja.no_leidas, 1)
        self.assertEqual(len(bandeja.items), 1)
        self.assertEqual(bandeja.items[0].actor.nombre_usuario, "ana")

    def test_un_intento_duplicado_no_crea_otra_notificacion(self):
        self.seguir()

        with self.assertRaises(HTTPException) as contexto:
            self.seguir()

        self.assertEqual(contexto.exception.status_code, 409)
        cantidad = self.db.scalar(
            select(func.count()).select_from(Notificacion)
        )
        self.assertEqual(cantidad, 1)

    def test_bandeja_oculta_notificaciones_de_usuarios_inactivos(self):
        self.seguir()
        self.ana.estado = EstadoUsuario.SUSPENDIDO
        self.db.commit()

        bandeja = listar_notificaciones(self.db, self.bea, 20)

        self.assertEqual(bandeja.items, [])
        self.assertEqual(bandeja.no_leidas, 0)

    def test_usuario_puede_marcar_una_o_todas_como_leidas(self):
        self.seguir()
        notificacion = self.db.scalar(select(Notificacion))

        respuesta = marcar_como_leida(notificacion.id, self.db, self.bea)

        self.assertEqual(respuesta.status_code, 204)
        self.db.refresh(notificacion)
        self.assertTrue(notificacion.leida)

        notificacion.leida = False
        self.db.commit()
        respuesta = marcar_todas_como_leidas(self.db, self.bea)

        self.assertEqual(respuesta.status_code, 204)
        self.db.refresh(notificacion)
        self.assertTrue(notificacion.leida)

    def test_no_se_puede_marcar_una_notificacion_ajena(self):
        self.seguir()
        notificacion = self.db.scalar(select(Notificacion))

        with self.assertRaises(HTTPException) as contexto:
            marcar_como_leida(notificacion.id, self.db, self.ana)

        self.assertEqual(contexto.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
