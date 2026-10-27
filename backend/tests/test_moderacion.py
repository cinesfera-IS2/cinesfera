import unittest
from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from sqlalchemy import select

from app.core.enums import (
    AccionModeracion,
    EstadoReporte,
    EstadoResena,
    RolUsuario,
    TipoReporte,
)
from app.models.contenido import Contenido
from app.models.moderacion import AuditoriaModeracion, Reporte
from app.models.resena import Resena
from app.models.usuario import Usuario
from app.schemas.moderacion import AccionReporteEntrada, ReporteCreacion
from app.services.moderacion_service import (
    ConflictoModeracionError,
    aplicar_accion,
    crear_reporte,
)
from tests.utilidades import crear_base_en_memoria, crear_usuario


class ModeracionServiceTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, Reporte, AuditoriaModeracion
        )
        self.reportante = crear_usuario(self.db, "reportante")
        self.autor = crear_usuario(self.db, "autor")
        self.admin = crear_usuario(self.db, "admin", rol=RolUsuario.ADMIN)
        self.contenido = Contenido(
            id=1, tmdb_id=550, tipo="pelicula", temporada=None,
            episodio=None, titulo="Película",
        )
        self.resena = Resena(
            id=uuid4(), usuario_id=self.autor.id, contenido_id=1,
            resena_padre_id=None, plataforma_id=None,
            calificacion=Decimal("4"), texto="Contenido original",
            fecha=datetime.now(timezone.utc), estado=EstadoResena.VISIBLE,
        )
        self.db.add_all([self.contenido, self.resena])
        self.db.commit()

    def _datos_comentario(self):
        return ReporteCreacion(
            tipo=TipoReporte.COMENTARIO,
            objetivo_id=self.resena.id,
            motivo="acoso",
            descripcion="Descripción opcional",
        )

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_reporte_conserva_snapshot_sin_ocultar_comentario(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_comentario())

        self.assertEqual(reporte.estado, EstadoReporte.PENDIENTE)
        self.assertIn("Contenido original", reporte.contenido_snapshot)
        self.assertEqual(self.db.get(Resena, self.resena.id).estado, EstadoResena.VISIBLE)

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_no_permite_reportar_dos_veces_el_mismo_elemento(self):
        crear_reporte(self.db, self.reportante, self._datos_comentario())
        with self.assertRaisesRegex(ConflictoModeracionError, "Ya reportaste"):
            crear_reporte(self.db, self.reportante, self._datos_comentario())

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_accion_oculta_comentario_cierra_reportes_y_audita(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_comentario())

        aplicar_accion(
            self.db,
            reporte,
            self.admin,
            AccionReporteEntrada(
                accion=AccionModeracion.OCULTAR_COMENTARIO,
                motivo="Incumple las reglas",
            ),
        )

        self.db.expire_all()
        self.assertEqual(self.db.get(Resena, self.resena.id).estado, EstadoResena.OCULTA)
        self.assertEqual(self.db.get(Reporte, reporte.id).estado, EstadoReporte.RESUELTO)
        auditoria = self.db.scalar(select(AuditoriaModeracion))
        self.assertEqual(auditoria.administrador_id, self.admin.id)
        self.assertEqual(auditoria.estado_anterior, "visible")
        self.assertEqual(auditoria.estado_nuevo, "oculta")

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_no_permite_autorreporte(self):
        self.resena.usuario_id = self.reportante.id
        self.db.commit()
        with self.assertRaisesRegex(ConflictoModeracionError, "propio comentario"):
            crear_reporte(self.db, self.reportante, self._datos_comentario())


if __name__ == "__main__":
    unittest.main()
