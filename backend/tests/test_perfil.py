import unittest
from datetime import datetime, timezone
from unittest.mock import Mock
from uuid import uuid4

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.enums import EstadoUsuario, RolUsuario
from app.main import app
from app.models.usuario import Usuario
from app.routers.usuarios import consultar_perfil, modificar_perfil
from app.schemas.usuario import UsuarioActualizacion


class PerfilTests(unittest.TestCase):
    def setUp(self):
        self.db = Mock(spec=Session)
        self.usuario_id = uuid4()
        self.usuario = Usuario(
            id=self.usuario_id,
            nombre="Persona",
            apellido="Prueba",
            nombre_usuario="persona",
            email="persona@example.com",
            password_hash="hash-no-publico",
            foto_url=None,
            rol=RolUsuario.USUARIO,
            estado=EstadoUsuario.ACTIVO,
            fecha_registro=datetime.now(timezone.utc)
        )
        self.db.get.return_value = self.usuario

    def test_obtener_perfil(self):
        resultado = consultar_perfil(self.usuario_id, self.db)

        self.assertIs(resultado, self.usuario)
        self.db.get.assert_called_once_with(Usuario, self.usuario_id)
        self.db.commit.assert_not_called()

    def test_actualizar_datos_y_foto(self):
        self.db.scalar.return_value = None
        datos = UsuarioActualizacion(
            nombre="  Nuevo  ",
            apellido="  Nombre  ",
            nombre_usuario="  NUEVO.USUARIO  ",
            email="  NUEVO@EXAMPLE.COM  ",
            foto_url="https://imagenes.example.com/perfil.jpg"
        )

        resultado = modificar_perfil(
            self.usuario_id,
            datos,
            self.db,
            self.usuario
        )

        self.assertIs(resultado, self.usuario)
        self.assertEqual(self.usuario.nombre, "Nuevo")
        self.assertEqual(self.usuario.apellido, "Nombre")
        self.assertEqual(self.usuario.nombre_usuario, "nuevo.usuario")
        self.assertEqual(self.usuario.email, "nuevo@example.com")
        self.assertEqual(
            self.usuario.foto_url,
            "https://imagenes.example.com/perfil.jpg"
        )
        self.db.commit.assert_called_once()
        self.db.refresh.assert_called_once_with(self.usuario)

    def test_enviar_foto_nula_elimina_la_foto(self):
        self.usuario.foto_url = "https://imagenes.example.com/anterior.jpg"

        modificar_perfil(
            self.usuario_id,
            UsuarioActualizacion(foto_url=None),
            self.db,
            self.usuario
        )

        self.assertIsNone(self.usuario.foto_url)
        self.db.commit.assert_called_once()

    def test_usuario_inexistente_responde_404(self):
        self.db.get.return_value = None

        with self.assertRaises(HTTPException) as contexto:
            consultar_perfil(self.usuario_id, self.db)

        self.assertEqual(contexto.exception.status_code, 404)
        self.assertEqual(
            contexto.exception.detail,
            "Usuario no encontrado"
        )

    def test_nombre_usuario_duplicado_responde_409(self):
        self.db.scalar.return_value = Usuario()

        with self.assertRaises(HTTPException) as contexto:
            modificar_perfil(
                self.usuario_id,
                UsuarioActualizacion(nombre_usuario="ocupado"),
                self.db,
                self.usuario
            )

        self.assertEqual(contexto.exception.status_code, 409)
        self.assertEqual(
            contexto.exception.detail,
            "El nombre de usuario ya está registrado"
        )
        self.db.commit.assert_not_called()

    def test_actualizacion_vacia_o_foto_invalida_se_rechaza(self):
        with self.assertRaises(ValidationError):
            UsuarioActualizacion()

        with self.assertRaises(ValidationError):
            UsuarioActualizacion(foto_url="archivo-local.jpg")

    def test_openapi_publica_los_endpoints(self):
        paths = app.openapi()["paths"]

        self.assertIn("get", paths["/usuarios/{usuario_id}/perfil"])
        self.assertIn("patch", paths["/usuarios/{usuario_id}/perfil"])


if __name__ == "__main__":
    unittest.main()
