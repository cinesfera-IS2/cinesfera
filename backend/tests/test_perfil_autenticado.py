import unittest
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt

from app.core import security
from app.main import app
from app.models.usuario import Usuario
from tests.utilidades import (
    PASSWORD_DE_PRUEBA,
    conectar_api,
    configurar_jwt,
    crear_base_en_memoria,
    crear_usuario
)


class PerfilAutenticadoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = PASSWORD_DE_PRUEBA
        cls.password_hash = security.generar_hash_password(cls.password)

    def setUp(self):
        self.secret = configurar_jwt(self)
        self.db = crear_base_en_memoria(self, Usuario)
        self.usuario_id = crear_usuario(
            self.db, "persona", password_hash=self.password_hash
        ).id
        self.otro_id = crear_usuario(
            self.db, "otra.persona", password_hash=self.password_hash
        ).id
        self.client = conectar_api(self, self.db)
        self.url = f"/usuarios/{self.usuario_id}/perfil"

    def iniciar_sesion(self):
        respuesta = self.client.post("/auth/login", json={
            "identificador": "persona", "password": self.password
        })
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.json()["token_type"], "bearer")
        return {"Authorization": f"Bearer {respuesta.json()['access_token']}"}

    def test_login_actualizacion_y_persistencia_de_datos_y_foto(self):
        headers = self.iniciar_sesion()
        cambios = {
            "nombre": "  Nuevo  ", "apellido": "  Apellido  ",
            "nombre_usuario": "  NUEVO.USUARIO  ",
            "email": "  NUEVO@EXAMPLE.COM  ",
            "foto_url": "https://imagenes.example.com/perfil.jpg"
        }
        respuesta = self.client.patch(self.url, headers=headers, json=cambios)
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        esperado = {
            "nombre": "Nuevo", "apellido": "Apellido",
            "nombre_usuario": "nuevo.usuario", "email": "nuevo@example.com",
            "foto_url": cambios["foto_url"]
        }
        self.db.expire_all()
        perfil = self.client.get("/auth/me", headers=headers)
        self.assertEqual(perfil.status_code, 200)
        for campo, valor in esperado.items():
            self.assertEqual(respuesta.json()[campo], valor)
            self.assertEqual(perfil.json()[campo], valor)
        self.assertNotIn("password_hash", respuesta.json())
        self.assertNotIn("password", respuesta.json())
        eliminado = self.client.patch(
            self.url, headers=headers, json={"foto_url": None}
        )
        self.assertEqual(eliminado.status_code, 200)
        self.db.expire_all()
        perfil = self.client.get("/auth/me", headers=headers).json()
        self.assertIsNone(perfil["foto_url"])
        self.assertEqual(perfil["nombre"], "Nuevo")
        nuevo_login = self.client.post("/auth/login", json={
            "identificador": "nuevo@example.com", "password": self.password
        })
        self.assertEqual(nuevo_login.status_code, 200)

    def test_sin_token_token_invalido_expirado_o_usuario_inexistente(self):
        for caso, headers in (
            ("sin token", {}),
            ("inválido", {"Authorization": "Bearer token-invalido"}),
            ("expirado", {"Authorization": "Bearer " + jwt.encode({
                "sub": str(self.usuario_id),
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1)
            }, self.secret, algorithm="HS256")}),
            ("usuario inexistente", {"Authorization": "Bearer " +
                security.generar_token_acceso(uuid4())})
        ):
            with self.subTest(caso=caso):
                respuesta = self.client.patch(
                    self.url, headers=headers, json={"nombre": "Intruso"}
                )
                self.assertEqual(respuesta.status_code, 401, respuesta.text)
                self.db.expire_all()
                self.assertEqual(self.db.get(Usuario, self.usuario_id).nombre, "Persona")

    def test_token_no_permite_actualizar_otro_perfil(self):
        respuesta = self.client.patch(
            f"/usuarios/{self.otro_id}/perfil", headers=self.iniciar_sesion(),
            json={"nombre": "Intruso", "foto_url": "https://example.com/foto.jpg"}
        )
        self.assertEqual(respuesta.status_code, 403)
        self.db.expire_all()
        otro = self.db.get(Usuario, self.otro_id)
        self.assertEqual(otro.nombre, "Persona")
        self.assertIsNone(otro.foto_url)

    def test_duplicados_e_invalidos_no_modifican_el_perfil(self):
        headers = self.iniciar_sesion()
        for datos, codigo in (
            ({"email": "otra.persona@example.com"}, 409),
            ({"nombre_usuario": "otra.persona"}, 409),
            ({}, 422), ({"foto_url": "archivo-local.jpg"}, 422),
            ({"nombre": None}, 422)
        ):
            with self.subTest(datos=datos):
                respuesta = self.client.patch(self.url, headers=headers, json=datos)
                self.assertEqual(respuesta.status_code, codigo, respuesta.text)
                self.db.expire_all()
                perfil = self.client.get("/auth/me", headers=headers).json()
                self.assertEqual(perfil["email"], "persona@example.com")
                self.assertEqual(perfil["nombre_usuario"], "persona")
                self.assertIsNone(perfil["foto_url"])

    def test_openapi_declara_bearer_para_actualizar(self):
        operacion = app.openapi()["paths"]["/usuarios/{usuario_id}/perfil"]["patch"]
        self.assertEqual(operacion["security"], [{"HTTPBearer": []}])
