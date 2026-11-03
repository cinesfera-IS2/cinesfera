import unittest

from app.core import security
from app.models.foto_perfil import FotoPerfil
from app.models.usuario import Usuario
from app.services.foto_perfil_service import FotoPerfilInvalidaError, validar_foto
from tests.utilidades import (
    PASSWORD_DE_PRUEBA,
    conectar_api,
    configurar_jwt,
    crear_base_en_memoria,
    crear_usuario,
)


PNG_MINIMO = b"\x89PNG\r\n\x1a\n" + b"contenido-de-prueba"
JPEG_MINIMO = b"\xFF\xD8\xFF" + b"contenido-de-prueba"


class ValidacionFotoPerfilTests(unittest.TestCase):
    def test_detecta_los_formatos_permitidos(self):
        self.assertEqual(validar_foto(PNG_MINIMO, "image/png"), "image/png")
        self.assertEqual(validar_foto(JPEG_MINIMO, "image/jpeg"), "image/jpeg")
        webp = b"RIFF\x10\x00\x00\x00WEBPcontenido"
        self.assertEqual(validar_foto(webp, "image/webp"), "image/webp")

    def test_rechaza_archivos_invalidos(self):
        with self.assertRaisesRegex(FotoPerfilInvalidaError, "vacía"):
            validar_foto(b"", "image/png")
        with self.assertRaisesRegex(FotoPerfilInvalidaError, "no coincide"):
            validar_foto(PNG_MINIMO, "image/jpeg")
        with self.assertRaisesRegex(FotoPerfilInvalidaError, "JPEG, PNG o WebP"):
            validar_foto(b"texto", "image/png")


class FotoPerfilTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = security.generar_hash_password(PASSWORD_DE_PRUEBA)

    def setUp(self):
        configurar_jwt(self)
        self.db = crear_base_en_memoria(self, Usuario, FotoPerfil)
        self.usuario = crear_usuario(
            self.db, "persona", password_hash=self.password_hash
        )
        self.otro = crear_usuario(
            self.db, "otra.persona", password_hash=self.password_hash
        )
        self.client = conectar_api(self, self.db)
        login = self.client.post(
            "/auth/login",
            json={"identificador": "persona", "password": PASSWORD_DE_PRUEBA},
        )
        self.headers = {"X-CSRF-Token": login.json()["csrf_token"]}
        self.url = f"/usuarios/{self.usuario.id}/foto-perfil"

    def test_sube_sirve_y_cambia_la_foto(self):
        respuesta = self.client.put(
            self.url,
            headers=self.headers,
            files={"archivo": ("perfil.png", PNG_MINIMO, "image/png")},
        )
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        primera_url = respuesta.json()["foto_url"]
        self.assertIn(self.url, primera_url)
        self.assertIn("?v=", primera_url)

        publica = self.client.get(self.url)
        self.assertEqual(publica.status_code, 200)
        self.assertEqual(publica.content, PNG_MINIMO)
        self.assertEqual(publica.headers["content-type"], "image/png")
        self.assertEqual(publica.headers["x-content-type-options"], "nosniff")

        cambio = self.client.put(
            self.url,
            headers=self.headers,
            files={"archivo": ("perfil.jpg", JPEG_MINIMO, "image/jpeg")},
        )
        self.assertEqual(cambio.status_code, 200, cambio.text)
        self.assertNotEqual(cambio.json()["foto_url"], primera_url)
        self.assertEqual(self.client.get(self.url).content, JPEG_MINIMO)
        self.assertEqual(self.db.query(FotoPerfil).count(), 1)

    def test_quita_la_foto(self):
        self.client.put(
            self.url,
            headers=self.headers,
            files={"archivo": ("perfil.png", PNG_MINIMO, "image/png")},
        )

        respuesta = self.client.delete(self.url, headers=self.headers)

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertIsNone(respuesta.json()["foto_url"])
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_rechaza_formato_falso_y_archivo_demasiado_grande(self):
        casos = (
            (("falsa.png", b"no-es-una-imagen", "image/png"), "JPEG, PNG o WebP"),
            (("falsa.jpg", PNG_MINIMO, "image/jpeg"), "no coincide"),
            (("grande.png", PNG_MINIMO + b"x" * (5 * 1024 * 1024), "image/png"), "5 MB"),
        )
        for archivo, mensaje in casos:
            with self.subTest(archivo=archivo[0]):
                respuesta = self.client.put(
                    self.url, headers=self.headers, files={"archivo": archivo}
                )
                self.assertEqual(respuesta.status_code, 422, respuesta.text)
                self.assertIn(mensaje, respuesta.json()["detail"])

    def test_no_permite_cambiar_la_foto_de_otra_persona(self):
        respuesta = self.client.put(
            f"/usuarios/{self.otro.id}/foto-perfil",
            headers=self.headers,
            files={"archivo": ("perfil.png", PNG_MINIMO, "image/png")},
        )
        self.assertEqual(respuesta.status_code, 403, respuesta.text)

    def test_exige_sesion_y_csrf(self):
        sin_csrf = self.client.put(
            self.url,
            files={"archivo": ("perfil.png", PNG_MINIMO, "image/png")},
        )
        self.assertEqual(sin_csrf.status_code, 403)
        self.client.cookies.clear()
        sin_sesion = self.client.put(
            self.url,
            headers=self.headers,
            files={"archivo": ("perfil.png", PNG_MINIMO, "image/png")},
        )
        self.assertEqual(sin_sesion.status_code, 401)


if __name__ == "__main__":
    unittest.main()
