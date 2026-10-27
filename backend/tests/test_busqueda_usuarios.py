import unittest

from app.core.enums import EstadoUsuario
from app.dependencies.auth import obtener_usuario_actual
from app.main import app
from app.models.usuario import Usuario
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class BusquedaUsuariosTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(self, Usuario)
        self.maria = crear_usuario(
            self.db, "mariacine", nombre="María", apellido="González",
            foto_url="https://example.com/maria.jpg",
        )
        self.client = conectar_api(self, self.db)
        app.dependency_overrides[obtener_usuario_actual] = lambda: self.maria

    def buscar(self, texto, **parametros):
        return self.client.get("/usuarios/buscar", params={"q": texto, **parametros})

    def test_coincidencias_parciales_y_mayusculas(self):
        for texto in ("María González", "María", "mariacine", "mariac", "MARÍA", "MARIACINE", "  María  ", "González"):
            with self.subTest(texto=texto):
                respuesta = self.buscar(texto)
                self.assertEqual(respuesta.status_code, 200, respuesta.text)
                self.assertEqual(respuesta.json()["usuarios"][0]["nombre_usuario"], "mariacine")

    def test_solo_expone_datos_publicos(self):
        usuario = self.buscar("maria").json()["usuarios"][0]
        self.assertEqual(set(usuario), {"id", "nombre", "apellido", "nombre_usuario", "foto_url"})
        self.assertEqual(usuario["foto_url"], "https://example.com/maria.jpg")

    def test_excluye_cuentas_inactivas(self):
        for estado in (EstadoUsuario.SUSPENDIDO, EstadoUsuario.ELIMINADO):
            crear_usuario(self.db, f"maria_{estado.value}", estado=estado)
        self.assertEqual(len(self.buscar("maria").json()["usuarios"]), 1)

    def test_sin_coincidencias_o_texto_vacio(self):
        for texto in ("inexistente", "", "   ", "%", "_"):
            with self.subTest(texto=texto):
                self.assertEqual(self.buscar(texto).json(), {"usuarios": [], "hay_mas": False})

    def test_paginacion_estable(self):
        crear_usuario(self.db, "maria02")
        crear_usuario(self.db, "maria01")
        primera = self.buscar("maria", limite=2).json()
        segunda = self.buscar("maria", limite=2, offset=2).json()
        self.assertEqual([u["nombre_usuario"] for u in primera["usuarios"]], ["maria01", "maria02"])
        self.assertTrue(primera["hay_mas"])
        self.assertEqual([u["nombre_usuario"] for u in segunda["usuarios"]], ["mariacine"])
        self.assertFalse(segunda["hay_mas"])

    def test_valida_limites(self):
        for parametros in ({"limite": 0}, {"limite": 51}, {"offset": -1}):
            self.assertEqual(self.buscar("maria", **parametros).status_code, 422)
        self.assertEqual(self.buscar("a" * 151).status_code, 422)

    def test_requiere_sesion(self):
        del app.dependency_overrides[obtener_usuario_actual]
        self.assertEqual(self.buscar("maria").status_code, 401)
