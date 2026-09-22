import unittest
from datetime import datetime, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.core.enums import EstadoUsuario, RolUsuario
from app.database import get_db
from app.dependencies.auth import obtener_usuario_actual
from app.main import app
from app.models.amistad import Amistad
from app.models.usuario import Usuario


class AmistadesTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            execution_options={"schema_translate_map": {"public": None}}
        )
        self.addCleanup(self.engine.dispose)
        metadata = MetaData()
        for modelo in (Usuario, Amistad):
            tabla = modelo.__table__.to_metadata(metadata)
            for columna in tabla.columns:
                columna.server_default = None
        metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.addCleanup(self.db.close)
        self.usuarios = []
        for nombre in ("ana", "bea", "carla"):
            usuario = Usuario(
                id=uuid4(), nombre=nombre, apellido="Prueba",
                nombre_usuario=nombre, email=f"{nombre}@example.com",
                password_hash="hash", rol=RolUsuario.USUARIO,
                estado=EstadoUsuario.ACTIVO, fecha_registro=datetime.now(timezone.utc)
            )
            self.db.add(usuario)
            self.usuarios.append(usuario)
        self.db.commit()
        anteriores = app.dependency_overrides.copy()
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[obtener_usuario_actual] = lambda: self.usuarios[0]
        self.addCleanup(self.restaurar_dependencias, anteriores)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    @staticmethod
    def restaurar_dependencias(anteriores):
        app.dependency_overrides.clear()
        app.dependency_overrides.update(anteriores)

    def actuar_como(self, indice):
        app.dependency_overrides[obtener_usuario_actual] = lambda: self.usuarios[indice]

    def enviar(self, destinatario):
        return self.client.post("/amistades/solicitudes", json={"destinatario_id": str(destinatario)})

    def test_enviar_aceptar_y_rechazar_solo_una_vez(self):
        ana, bea, carla = self.usuarios
        respuesta = self.enviar(bea.id)
        self.assertEqual(respuesta.status_code, 201, respuesta.text)
        self.assertEqual(respuesta.json()["estado"], "pendiente")
        self.assertIsNone(respuesta.json()["fecha_respuesta"])
        self.assertEqual(self.enviar(bea.id).status_code, 409)
        self.actuar_como(1)
        self.assertEqual(self.enviar(ana.id).status_code, 409)
        ruta = f"/amistades/solicitudes/{ana.id}"
        respuesta = self.client.post(f"{ruta}/aceptar")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["estado"], "aceptada")
        self.assertIsNotNone(respuesta.json()["fecha_respuesta"])
        self.assertEqual(self.client.post(f"{ruta}/rechazar").status_code, 409)
        self.assertEqual(self.enviar(ana.id).status_code, 409)

        self.actuar_como(0)
        self.assertEqual(self.enviar(carla.id).status_code, 201)
        self.actuar_como(2)
        respuesta = self.client.post(f"/amistades/solicitudes/{ana.id}/rechazar")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["estado"], "rechazada")
        self.assertEqual(self.client.post(f"/amistades/solicitudes/{ana.id}/aceptar").status_code, 409)

    def test_validaciones_y_permisos(self):
        ana, bea, carla = self.usuarios
        self.assertEqual(self.enviar(ana.id).status_code, 400)
        self.assertEqual(self.enviar(uuid4()).status_code, 404)
        self.assertEqual(self.enviar(bea.id).status_code, 201)
        ruta = f"/amistades/solicitudes/{ana.id}/aceptar"
        self.assertEqual(self.client.post(ruta).status_code, 404)
        self.actuar_como(2)
        self.assertEqual(self.client.post(ruta).status_code, 404)
        self.actuar_como(1)
        self.assertEqual(self.client.post(f"/amistades/solicitudes/{uuid4()}/rechazar").status_code, 404)


if __name__ == "__main__":
    unittest.main()
