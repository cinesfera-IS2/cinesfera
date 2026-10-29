import unittest
from datetime import datetime, timezone
from unittest.mock import patch
from uuid import uuid4

from app.core.enums import EstadoUsuario, RolUsuario
from app.core.security import generar_token_acceso
from app.models.usuario import Usuario
from tests.utilidades import (
    conectar_api,
    configurar_jwt,
    crear_base_en_memoria,
    crear_usuario
)


class AdministracionUsuariosTests(unittest.TestCase):
    def setUp(self):
        configurar_jwt(self)
        self.db = crear_base_en_memoria(self, Usuario)
        self.admin = crear_usuario(
            self.db,
            "administrador",
            rol=RolUsuario.ADMIN
        )
        self.usuario = crear_usuario(self.db, "persona")
        self.usuario_comun = crear_usuario(self.db, "usuario.comun")
        self.client = conectar_api(self, self.db)

    @staticmethod
    def _headers(usuario: Usuario) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {generar_token_acceso(usuario.id)}"
        }

    def test_administrador_puede_suspender_una_cuenta(self):
        respuesta = self.client.patch(
            f"/usuarios/{self.usuario.id}/suspender",
            headers=self._headers(self.admin)
        )

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["estado"], "suspendido")
        self.db.expire_all()
        self.assertEqual(
            self.db.get(Usuario, self.usuario.id).estado,
            EstadoUsuario.SUSPENDIDO
        )

    def test_administrador_puede_eliminar_una_cuenta_logicamente(self):
        respuesta = self.client.delete(
            f"/usuarios/{self.usuario.id}",
            headers=self._headers(self.admin)
        )

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["estado"], "eliminado")
        self.db.expire_all()
        usuario_guardado = self.db.get(Usuario, self.usuario.id)
        self.assertIsNotNone(usuario_guardado)
        self.assertEqual(usuario_guardado.estado, EstadoUsuario.ELIMINADO)

    def test_usuario_comun_no_puede_suspender_ni_eliminar(self):
        headers = self._headers(self.usuario_comun)

        for metodo, ruta in (
            (self.client.patch, f"/usuarios/{self.usuario.id}/suspender"),
            (self.client.delete, f"/usuarios/{self.usuario.id}")
        ):
            with self.subTest(ruta=ruta):
                respuesta = metodo(ruta, headers=headers)
                self.assertEqual(respuesta.status_code, 403, respuesta.text)
                self.assertEqual(
                    respuesta.json()["detail"],
                    "Se requieren permisos de administrador"
                )

        self.db.expire_all()
        self.assertEqual(
            self.db.get(Usuario, self.usuario.id).estado,
            EstadoUsuario.ACTIVO
        )

    def test_endpoints_requieren_autenticacion(self):
        for metodo, ruta in (
            (self.client.patch, f"/usuarios/{self.usuario.id}/suspender"),
            (self.client.delete, f"/usuarios/{self.usuario.id}")
        ):
            with self.subTest(ruta=ruta):
                respuesta = metodo(ruta)
                self.assertEqual(respuesta.status_code, 401, respuesta.text)

    def test_cuenta_inexistente_responde_404(self):
        headers = self._headers(self.admin)

        for metodo, ruta in (
            (self.client.patch, f"/usuarios/{uuid4()}/suspender"),
            (self.client.delete, f"/usuarios/{uuid4()}")
        ):
            with self.subTest(ruta=ruta):
                respuesta = metodo(ruta, headers=headers)
                self.assertEqual(respuesta.status_code, 404, respuesta.text)

    def test_no_se_puede_suspender_una_cuenta_eliminada(self):
        self.usuario.estado = EstadoUsuario.ELIMINADO
        self.db.commit()

        respuesta = self.client.patch(
            f"/usuarios/{self.usuario.id}/suspender",
            headers=self._headers(self.admin)
        )

        self.assertEqual(respuesta.status_code, 409, respuesta.text)
        self.assertEqual(
            respuesta.json()["detail"],
            "No se puede suspender una cuenta eliminada"
        )

    def test_cuentas_no_activas_no_pueden_usar_una_sesion_existente(self):
        for estado in (EstadoUsuario.SUSPENDIDO, EstadoUsuario.ELIMINADO):
            with self.subTest(estado=estado):
                self.usuario.estado = estado
                self.db.commit()

                respuesta = self.client.get(
                    "/auth/me",
                    headers=self._headers(self.usuario)
                )

                self.assertEqual(respuesta.status_code, 403, respuesta.text)
                self.assertEqual(
                    respuesta.json()["detail"],
                    (
                        "Tu cuenta ha sido suspendida"
                        if estado == EstadoUsuario.SUSPENDIDO
                        else "La cuenta no está activa"
                    )
                )

    def test_sesion_existente_muestra_reactivacion_en_hora_uruguaya(self):
        self.usuario.estado = EstadoUsuario.SUSPENDIDO
        self.usuario.suspension_hasta = datetime(
            2026, 10, 29, 22, 34, 11, tzinfo=timezone.utc
        )
        self.usuario.motivo_suspension = "Motivo administrativo privado"
        self.db.commit()

        with patch(
            "app.dependencies.auth.suspension_vencida",
            return_value=False,
        ):
            respuesta = self.client.get(
                "/auth/me",
                headers=self._headers(self.usuario),
            )

        self.assertEqual(respuesta.status_code, 403, respuesta.text)
        self.assertEqual(
            respuesta.json()["detail"],
            (
                "Tu cuenta ha sido suspendida. Podrás volver a ingresar el "
                "29/10/2026 a las 19:34 (hora de Uruguay)."
            ),
        )
        self.assertNotIn("Motivo administrativo privado", respuesta.text)

    def test_openapi_declara_autenticacion_en_ambos_endpoints(self):
        paths = self.client.get("/openapi.json").json()["paths"]

        self.assertEqual(
            paths["/usuarios/{usuario_id}/suspender"]["patch"]["security"],
            [{"HTTPBearer": []}]
        )
        self.assertEqual(
            paths["/usuarios/{usuario_id}"]["delete"]["security"],
            [{"HTTPBearer": []}]
        )


if __name__ == "__main__":
    unittest.main()
