import unittest
from datetime import datetime, timezone
from unittest.mock import Mock
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.enums import EstadoUsuario, RolUsuario
from app.core.security import generar_hash_password
from app.main import app
from app.models.usuario import Usuario
from app.routers.auth import login
from app.schemas.usuario import TokenRespuesta, UsuarioLogin
from unittest.mock import Mock, patch

class InicioSesionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password = "ClaveSegura123"
        cls.hash_guardado = generar_hash_password(cls.password)

    def setUp(self):
        self.db = Mock(spec=Session)
        self.usuario = Usuario(
            id=uuid4(),
            nombre="Persona",
            apellido="Prueba",
            nombre_usuario="persona",
            email="persona@example.com",
            password_hash=self.hash_guardado,
            foto_url=None,
            rol=RolUsuario.USUARIO,
            estado=EstadoUsuario.ACTIVO,
            fecha_registro=datetime.now(timezone.utc)
        )

    def test_inicio_correcto_por_email_o_nombre_usuario(self):
        for identificador, campo, normalizado in (
        (" PERSONA@EXAMPLE.COM ", "email", "persona@example.com"),
        (" PERSONA ", "nombre_usuario", "persona")
    ):
            with self.subTest(identificador=identificador):
                self.db.scalar.return_value = self.usuario

                with patch(
                    "app.routers.auth.generar_token_acceso",
                    return_value="token-prueba"
                ):
                    resultado = login(
                        UsuarioLogin(
                            identificador=identificador,
                            password=self.password
                    ),
                    self.db
                )

                self.assertIsInstance(resultado, TokenRespuesta)
                self.assertEqual(
                    resultado.access_token,
                    "token-prueba"
                )
                self.assertEqual(resultado.token_type, "bearer")

                consulta = self.db.scalar.call_args.args[0]
                self.assertIn(campo, str(consulta.whereclause))
                self.assertIn(
                    normalizado,
                    consulta.compile().params.values()
                )
                self.db.commit.assert_not_called()

    def test_credenciales_incorrectas_responden_el_mismo_error(self):
        for identificador in ("persona@example.com", "persona"):
            for encontrado, password in (
                (self.usuario, "incorrecta"),
                (self.usuario, ""),
                (self.usuario, self.password + " "),
                (None, self.password)
            ):
                with self.subTest(
                    identificador=identificador,
                    existe=encontrado is not None,
                    password=password
                ):
                    self.db.scalar.return_value = encontrado
                    with self.assertRaises(HTTPException) as contexto:
                        login(
                            UsuarioLogin(
                                identificador=identificador,
                                password=password
                            ),
                            self.db
                        )

                    self.assertEqual(contexto.exception.status_code, 401)
                    self.assertEqual(
                        contexto.exception.detail,
                        "Credenciales inválidas"
                    )
                    self.db.commit.assert_not_called()

    def test_respuesta_publica_no_expone_password(self):
        self.db.scalar.return_value = self.usuario

        with patch(
            "app.routers.auth.generar_token_acceso",
            return_value="token-prueba"
        ):
            resultado = login(
                UsuarioLogin(
                    identificador="persona", 
                    password=self.password
                ),
            self.db
        )
        respuesta = resultado.model_dump()

        self.assertEqual(respuesta["access_token"], "token-prueba")
        self.assertEqual(respuesta["token_type"], "bearer")
        self.assertNotIn("password", respuesta)
        self.assertNotIn("password_hash", respuesta)

    def test_endpoint_declara_respuesta_publica(self):
        esquema = app.openapi()
        respuesta = esquema["paths"]["/auth/login"]["post"]["responses"]["200"]
        self.assertEqual(
            respuesta["content"]["application/json"]["schema"]["$ref"],
            "#/components/schemas/TokenRespuesta"
        )


if __name__ == "__main__":
    unittest.main()
