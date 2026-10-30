import unittest
from unittest.mock import patch

from sqlalchemy import func, select

from app.core.config import Settings
from app.core.enums import RolUsuario
from app.models.usuario import Usuario
from app.services.bootstrap_admin import crear_administrador_inicial
from tests.utilidades import crear_base_en_memoria, crear_usuario


class BootstrapAdminTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(self, Usuario)
        self.settings = Settings(
            _env_file=None,
            admin_inicial_email="admin@example.com",
            admin_inicial_password="ClaveInicialSegura123",
            admin_inicial_usuario="admin.principal",
            admin_inicial_nombre="Admin",
            admin_inicial_apellido="Principal",
            cookie_secure=False,
        )

    @patch("app.services.bootstrap_admin.generar_hash_password", return_value="hash-seguro")
    def test_crea_unico_admin_principal_con_password_hasheada(self, hashear):
        creado = crear_administrador_inicial(self.db, self.settings)
        segundo = crear_administrador_inicial(self.db, self.settings)

        self.assertIsNotNone(creado)
        self.assertIsNone(segundo)
        self.assertEqual(creado.rol, RolUsuario.ADMIN)
        self.assertTrue(creado.es_admin_principal)
        self.assertEqual(creado.password_hash, "hash-seguro")
        hashear.assert_called_once_with("ClaveInicialSegura123")
        cantidad = self.db.scalar(select(func.count()).select_from(Usuario))
        self.assertEqual(cantidad, 1)

    def test_no_crea_otro_si_ya_existe_un_admin(self):
        crear_usuario(self.db, "existente", rol=RolUsuario.ADMIN)
        self.assertIsNone(crear_administrador_inicial(self.db, self.settings))


if __name__ == "__main__":
    unittest.main()
