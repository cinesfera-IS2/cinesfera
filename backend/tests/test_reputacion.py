import unittest
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from app.core.enums import EstadoResena
from app.models.contenido import Contenido
from app.models.resena import CalificacionResena, Resena, ValoracionResena
from app.models.usuario import Usuario
from app.schemas.contenido import CalificacionActualizacion, ResenaCreacion
from app.services.contenido_service import (
    actualizar_calificacion,
    crear_resena,
    eliminar_resena,
)
from app.services.reputacion_service import recalcular_reputacion
from tests.utilidades import crear_base_en_memoria, crear_usuario


class ReputacionTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, CalificacionResena, ValoracionResena,
        )
        self.autor = crear_usuario(self.db, "autor-reputacion")
        self.db.add(Contenido(id=1, tmdb_id=42, tipo="pelicula"))
        self.db.commit()

    def test_sin_calificaciones_es_cero(self):
        reputacion = recalcular_reputacion(self.db, self.autor.id)
        self.db.commit()

        self.assertEqual(reputacion, Decimal("0.00"))
        self.assertEqual(self.autor.reputacion, Decimal("0.00"))

    def test_incluye_ocultas_excluye_eliminadas_y_redondea(self):
        oculta = self._resena(EstadoResena.OCULTA)
        eliminada = self._resena(EstadoResena.ELIMINADA)
        calificadores = [
            crear_usuario(self.db, f"calificador-{indice}") for indice in range(4)
        ]
        self.db.add_all([
            self._calificacion(calificadores[0], oculta, "1"),
            self._calificacion(calificadores[1], oculta, "2"),
            self._calificacion(calificadores[2], oculta, "4"),
            self._calificacion(calificadores[3], eliminada, "5"),
        ])
        self.db.flush()

        reputacion = recalcular_reputacion(self.db, self.autor.id)
        self.db.commit()

        self.assertEqual(reputacion, Decimal("2.33"))
        self.assertEqual(self.autor.reputacion, Decimal("2.33"))

    def test_alta_edicion_y_eliminacion_recalculan_reputacion(self):
        padre = self._resena(EstadoResena.VISIBLE)
        critico = crear_usuario(self.db, "critico-reputacion")

        creada = crear_resena(
            self.db,
            "pelicula",
            42,
            critico.id,
            ResenaCreacion(
                usuario_id=critico.id,
                texto="Comentario con estrellas",
                calificacion=Decimal("4.5"),
                resena_padre_id=padre.id,
            ),
        )
        self.db.refresh(self.autor)
        self.assertEqual(self.autor.reputacion, Decimal("4.50"))

        actualizar_calificacion(
            self.db,
            "pelicula",
            42,
            padre.id,
            critico.id,
            CalificacionActualizacion(calificacion=Decimal("2")),
        )
        self.db.refresh(self.autor)
        self.assertEqual(self.autor.reputacion, Decimal("2.00"))

        eliminar_resena(self.db, "pelicula", 42, creada.id, critico)
        self.db.refresh(self.autor)
        self.assertEqual(self.autor.reputacion, Decimal("0.00"))

    def _resena(self, estado: EstadoResena) -> Resena:
        resena = Resena(
            id=uuid4(), usuario_id=self.autor.id, contenido_id=1,
            calificacion=Decimal("5"), texto="Resena de reputacion",
            fecha=datetime.now(timezone.utc), estado=estado,
        )
        self.db.add(resena)
        self.db.flush()
        return resena

    @staticmethod
    def _calificacion(usuario: Usuario, resena: Resena, valor: str) -> CalificacionResena:
        return CalificacionResena(
            usuario_id=usuario.id, resena_id=resena.id,
            calificacion=Decimal(valor), fecha_actualizacion=datetime.now(timezone.utc),
        )


if __name__ == "__main__":
    unittest.main()
