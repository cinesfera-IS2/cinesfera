import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch
from uuid import uuid4

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core import security
from app.core.enums import EstadoUsuario, RolUsuario
from app.database import get_db
from app.main import app
from app.models.usuario import Usuario


class PerfilAutenticadoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = "ClaveSegura123"
        cls.password_hash = security.generar_hash_password(cls.password)

    def setUp(self):
        self.secret = "clave-de-pruebas-aisladas-de-al-menos-32-caracteres"
        self.jwt_config = patch.multiple(
            security, JWT_SECRET_KEY=self.secret, JWT_ALGORITHM="HS256",
            JWT_EXPIRE_MINUTES=30
        )
        self.jwt_config.start()
        self.addCleanup(self.jwt_config.stop)
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            execution_options={"schema_translate_map": {"public": None}}
        )
        self.addCleanup(self.engine.dispose)
        # Adaptar solo el DDL de PostgreSQL; conservar el modelo y servicios reales.
        metadata = MetaData()
        tabla = Usuario.__table__.to_metadata(metadata, schema=None)
        for columna in tabla.columns:
            columna.server_default = None
        metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.addCleanup(self.db.close)
        self.usuario_id, self.otro_id = uuid4(), uuid4()
        for usuario_id, identificador in (
            (self.usuario_id, "persona"), (self.otro_id, "otra.persona")
        ):
            self.db.add(Usuario(
                id=usuario_id, nombre="Persona", apellido="Prueba",
                nombre_usuario=identificador, email=f"{identificador}@example.com",
                password_hash=self.password_hash, foto_url=None,
                rol=RolUsuario.USUARIO, estado=EstadoUsuario.ACTIVO,
                fecha_registro=datetime.now(timezone.utc)
            ))
        self.db.commit()

        def db_pruebas():
            yield self.db

        anteriores = app.dependency_overrides.copy()
        app.dependency_overrides[get_db] = db_pruebas
        self.addCleanup(self.restaurar_dependencias, anteriores)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.url = f"/usuarios/{self.usuario_id}/perfil"

    @staticmethod
    def restaurar_dependencias(anteriores):
        app.dependency_overrides.clear()
        app.dependency_overrides.update(anteriores)

    def iniciar_sesion(self):
        respuesta = self.client.post(
            "/auth/login", 
            json={
                "identificador": "persona", 
                "password": self.password
        }
        )
        self.assertEqual(respuesta.status_code, 200)
        


        self.assertIn(
            "access_token", 
            self.client.cookies
        )
        return {
            "X-CSRF-Token": respuesta.json()["csrf_token"]
        }

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


    
    
    def test_logout_elimina_sesion(self):
        # Iniciar sesión y obtener el token CSRF
        headers = self.iniciar_sesion()

        # Comprobar que existe la cookie
        self.assertIn(
            "access_token",
            self.client.cookies
        )

        # Cerrar sesión enviando el token CSRF
        respuesta = self.client.post(
            "/auth/logout",
            headers=headers
        )

        self.assertEqual(respuesta.status_code, 200)

        # Comprobar que desapareció la cookie
        self.assertNotIn(
            "access_token",
            self.client.cookies
        )

        # Comprobar que ya no podemos acceder al perfil
        respuesta = self.client.get("/auth/me")

        self.assertEqual(respuesta.status_code, 401)
        self.assertEqual(
            respuesta.json()["detail"],
            "No hay una sesión activa"
        )

    
    def test_perfil_rechaza_csrf_invalido_o_ausente(self):
        # Iniciar sesión correctamente
        self.iniciar_sesion()

        # Obtener el ID del usuario autenticado
        respuesta = self.client.get("/auth/me")
        self.assertEqual(respuesta.status_code, 200)

        usuario_id = respuesta.json()["id"]

        # Intentar modificar el perfil sin CSRF
        respuesta = self.client.patch(
            f"/usuarios/{usuario_id}/perfil",
            json={"nombre": "Intruso"}
        )

        self.assertEqual(respuesta.status_code, 403)
        self.assertIn("CSRF", respuesta.json()["detail"])

        # Intentar modificarlo con un CSRF incorrecto
        respuesta = self.client.patch(
            f"/usuarios/{usuario_id}/perfil",
            json={"nombre": "Intruso"},
            headers={"X-CSRF-Token": "token-falso"}
        )

        self.assertEqual(respuesta.status_code, 403)
        self.assertIn("CSRF", respuesta.json()["detail"])


    
    def test_consulta_perfil_privado(self):
        # Sin sesión: acceso denegado
        self.client.cookies.clear()

        respuesta = self.client.get(
            f"/usuarios/{self.otro_id}/perfil"
        )
        self.assertEqual(respuesta.status_code, 401)

        # Iniciar sesión
        self.iniciar_sesion()

        respuesta = self.client.get("/auth/me")
        self.assertEqual(respuesta.status_code, 200)
        mi_id = respuesta.json()["id"]

        # Consultar el perfil propio
        respuesta = self.client.get(
            f"/usuarios/{mi_id}/perfil"
        )
        self.assertEqual(respuesta.status_code, 200)

        # Intentar consultar el perfil privado de otro usuario
        respuesta = self.client.get(
            f"/usuarios/{self.otro_id}/perfil"
        )
        self.assertEqual(respuesta.status_code, 403)


        
