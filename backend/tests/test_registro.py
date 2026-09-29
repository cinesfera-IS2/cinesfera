import unittest

from sqlalchemy import func, select

from app.core.security import verificar_password
from app.models.usuario import Usuario
from tests.utilidades import (
    conectar_api,
    configurar_jwt,
    crear_base_en_memoria,
    crear_usuario
)


def datos_validos(**cambios) -> dict:
    """Un registro que la API acepta; cada test cambia solo lo que le importa."""
    return {
        "nombre": "Ana",
        "apellido": "García",
        "nombre_usuario": "ana.garcia",
        "email": "ana@example.com",
        "password": "ClaveSegura123",
        **cambios
    }


class RegistroTests(unittest.TestCase):
    def setUp(self):
        # Cada test arranca con una base vacía, salvo por "existente", que
        # sirve para probar los duplicados.
        configurar_jwt(self)
        self.db = crear_base_en_memoria(self, Usuario)
        crear_usuario(self.db, "existente")
        self.client = conectar_api(self, self.db)

    def cantidad_de_usuarios(self) -> int:
        return self.db.scalar(select(func.count()).select_from(Usuario))

    def test_registro_correcto_guarda_el_usuario_normalizado(self):
        # Ejecutar
        respuesta = self.client.post("/auth/register", json=datos_validos(
            nombre="  Ana  ",
            nombre_usuario="  ANA.GARCIA  ",
            email="  ANA@EXAMPLE.COM  "
        ))

        # Verificar la respuesta
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        cuerpo = respuesta.json()
        self.assertEqual(cuerpo["nombre"], "Ana")
        self.assertEqual(cuerpo["nombre_usuario"], "ana.garcia")
        self.assertEqual(cuerpo["email"], "ana@example.com")
        self.assertEqual(cuerpo["rol"], "usuario")
        self.assertEqual(cuerpo["estado"], "activo")
        self.assertIsNone(cuerpo["foto_url"])
        self.assertNotIn("password", cuerpo)
        self.assertNotIn("password_hash", cuerpo)

        # Verificar lo que quedó en la base
        guardado = self.db.scalar(
            select(Usuario).where(Usuario.nombre_usuario == "ana.garcia")
        )
        self.assertIsNotNone(guardado)
        self.assertNotEqual(guardado.password_hash, "ClaveSegura123")
        self.assertTrue(
            verificar_password("ClaveSegura123", guardado.password_hash)
        )

    def test_despues_de_registrarse_puede_iniciar_sesion(self):
        self.client.post("/auth/register", json=datos_validos())

        for identificador in ("ana@example.com", "ana.garcia"):
            with self.subTest(identificador=identificador):
                respuesta = self.client.post("/auth/login", json={
                    "identificador": identificador,
                    "password": "ClaveSegura123"
                })

                self.assertEqual(respuesta.status_code, 200, respuesta.text)
                self.assertTrue(respuesta.json()["access_token"])

    def test_email_o_nombre_de_usuario_repetido_responde_409(self):
        for campo, valor, mensaje in (
            ("email", "EXISTENTE@example.com", "El email ya está registrado"),
            ("nombre_usuario", "Existente",
             "El nombre de usuario ya está registrado")
        ):
            with self.subTest(campo=campo):
                antes = self.cantidad_de_usuarios()

                respuesta = self.client.post(
                    "/auth/register", json=datos_validos(**{campo: valor})
                )

                self.assertEqual(respuesta.status_code, 409, respuesta.text)
                self.assertEqual(respuesta.json()["detail"], mensaje)
                self.assertEqual(self.cantidad_de_usuarios(), antes)

    def test_datos_invalidos_responden_422_y_no_crean_nada(self):
        faltan_campos = datos_validos()
        del faltan_campos["email"]

        for caso, datos in (
            ("contraseña corta", datos_validos(password="corta")),
            ("email mal formado", datos_validos(email="no-es-un-email")),
            ("nombre de usuario con espacios",
             datos_validos(nombre_usuario="ana garcia")),
            ("nombre de usuario muy corto", datos_validos(nombre_usuario="an")),
            ("nombre de una letra", datos_validos(nombre="A")),
            ("falta el email", faltan_campos)
        ):
            with self.subTest(caso=caso):
                antes = self.cantidad_de_usuarios()

                respuesta = self.client.post("/auth/register", json=datos)

                self.assertEqual(respuesta.status_code, 422, respuesta.text)
                self.assertEqual(self.cantidad_de_usuarios(), antes)


if __name__ == "__main__":
    unittest.main()
