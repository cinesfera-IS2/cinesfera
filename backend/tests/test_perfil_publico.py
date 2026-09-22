import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models.resena import Resena, ValoracionResena
from app.models.usuario import Usuario
from app.core.enums import EstadoUsuario, RolUsuario


class PerfilPublicoTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://", connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            execution_options={"schema_translate_map": {"public": None}}
        )
        self.addCleanup(self.engine.dispose)
        metadata = MetaData()
        for modelo in (Usuario, Resena, ValoracionResena):
            tabla = modelo.__table__.to_metadata(metadata, schema=None)
            for columna in tabla.columns:
                columna.server_default = None
        metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.addCleanup(self.db.close)
        self.usuario_id, otro_id = uuid4(), uuid4()
        ahora = datetime.now(timezone.utc)
        for id_, nombre in ((self.usuario_id, "ana"), (otro_id, "bea")):
            self.db.add(Usuario(
                id=id_, nombre=nombre.title(), apellido="Prueba",
                nombre_usuario=nombre, email=f"{nombre}@example.com",
                password_hash="secreto", foto_url="https://example.com/foto.jpg",
                rol=RolUsuario.USUARIO, estado=EstadoUsuario.ACTIVO,
                fecha_registro=ahora
            ))
        antigua_id, reciente_id, ajena_id = uuid4(), uuid4(), uuid4()
        for id_, autor, fecha in (
            (antigua_id, self.usuario_id, ahora - timedelta(days=2)),
            (reciente_id, self.usuario_id, ahora),
            (ajena_id, otro_id, ahora + timedelta(days=1))
        ):
            self.db.add(Resena(
                id=id_, usuario_id=autor, contenido_tmdb_id=42,
                plataforma_id=None, calificacion=Decimal("4.5"),
                texto="Una reseña", fecha=fecha
            ))
        self.db.flush()
        self.db.add_all([
            ValoracionResena(usuario_id=otro_id, resena_id=antigua_id, valor=1),
            ValoracionResena(usuario_id=self.usuario_id, resena_id=reciente_id, valor=-1),
            ValoracionResena(usuario_id=self.usuario_id, resena_id=ajena_id, valor=1)
        ])
        self.db.commit()
        anteriores = app.dependency_overrides.copy()
        app.dependency_overrides[get_db] = lambda: self.db
        self.addCleanup(self.restaurar_dependencias, anteriores)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.antigua_id, self.reciente_id = antigua_id, reciente_id

    @staticmethod
    def restaurar_dependencias(anteriores):
        app.dependency_overrides.clear()
        app.dependency_overrides.update(anteriores)

    def test_datos_publicos_resenas_ordenadas_y_reputacion(self):
        respuesta = self.client.get(f"/usuarios/{self.usuario_id}/perfil-publico")
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        datos = respuesta.json()
        self.assertEqual(datos["nombre"], "Ana")
        self.assertEqual(datos["foto_url"], "https://example.com/foto.jpg")
        self.assertEqual(datos["reputacion"], 0)
        self.assertEqual(
            [resena["id"] for resena in datos["resenas"]],
            [str(self.reciente_id), str(self.antigua_id)]
        )
        self.assertEqual(datos["resenas"][0]["calificacion"], 4.5)
        self.assertNotIn("email", datos)
        self.assertNotIn("password_hash", datos)

    def test_usuario_inexistente(self):
        respuesta = self.client.get(f"/usuarios/{uuid4()}/perfil-publico")
        self.assertEqual(respuesta.status_code, 404)


if __name__ == "__main__":
    unittest.main()
