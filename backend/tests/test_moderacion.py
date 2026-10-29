import unittest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

from sqlalchemy import select

from app.core.enums import (
    AccionModeracion,
    EstadoReporte,
    EstadoResena,
    EstadoUsuario,
    RolUsuario,
    TipoReporte,
)
from app.models.contenido import Contenido
from app.models.moderacion import AuditoriaModeracion, Reporte
from app.models.resena import Resena
from app.models.usuario import Usuario
from app.routers.administracion import listar_usuarios, obtener_detalle_reporte, obtener_resumen
from app.schemas.moderacion import AccionReporteEntrada, AdministradorCreacion, ReporteCreacion
from app.services.moderacion_service import (
    ConflictoModeracionError,
    aplicar_accion,
    crear_administrador,
    crear_reporte,
)
from app.services.busqueda_usuarios import buscar_usuarios
from app.services.usuario_service import UsuarioNoEncontradoError, obtener_perfil_publico
from tests.utilidades import crear_base_en_memoria, crear_usuario


class ModeracionServiceTests(unittest.TestCase):
    def setUp(self):
        self.db = crear_base_en_memoria(
            self, Usuario, Contenido, Resena, Reporte, AuditoriaModeracion
        )
        self.reportante = crear_usuario(self.db, "reportante")
        self.otro_reportante = crear_usuario(self.db, "otro.reportante")
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

    def _datos_usuario(self):
        return ReporteCreacion(
            tipo=TipoReporte.USUARIO,
            objetivo_id=self.autor.id,
            motivo="acoso",
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
    def test_detalle_agrupa_denunciantes_estado_e_historial(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_comentario())
        crear_reporte(self.db, self.otro_reportante, self._datos_comentario())
        aplicar_accion(
            self.db,
            reporte,
            self.admin,
            AccionReporteEntrada(
                accion=AccionModeracion.OCULTAR_COMENTARIO,
                motivo="Incumple las reglas",
            ),
        )

        detalle = obtener_detalle_reporte(reporte.id, self.db, self.admin)

        self.assertEqual(len(detalle.denunciantes), 2)
        self.assertEqual(
            {denunciante.usuario for denunciante in detalle.denunciantes},
            {"reportante", "otro.reportante"},
        )
        self.assertEqual(detalle.estado_contenido, EstadoResena.OCULTA)
        self.assertEqual(detalle.estado_objetivo_usuario.value, "activo")
        self.assertEqual(len(detalle.historial), 1)
        self.assertEqual(
            detalle.historial[0].accion,
            AccionModeracion.OCULTAR_COMENTARIO,
        )

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_no_permite_autorreporte(self):
        self.resena.usuario_id = self.reportante.id
        self.db.commit()
        with self.assertRaisesRegex(ConflictoModeracionError, "propio comentario"):
            crear_reporte(self.db, self.reportante, self._datos_comentario())

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_suspension_temporal_por_horas_calcula_fin_y_audita(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_usuario())
        antes = datetime.now(timezone.utc)
        aplicar_accion(self.db, reporte, self.admin, AccionReporteEntrada(
            accion=AccionModeracion.SUSPENDER_USUARIO,
            motivo="Incumplimiento reiterado",
            tipo_suspension="temporal",
            duracion_suspension=3,
            unidad_suspension="horas",
        ))
        self.db.refresh(self.autor)
        self.assertGreaterEqual(
            self.autor.suspension_hasta.replace(tzinfo=timezone.utc),
            antes + timedelta(hours=3),
        )
        auditoria = self.db.scalar(select(AuditoriaModeracion).where(
            AuditoriaModeracion.accion == AccionModeracion.SUSPENDER_USUARIO
        ))
        self.assertIsNotNone(auditoria.suspension_inicio)
        self.assertEqual(auditoria.suspension_fin, self.autor.suspension_hasta)

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_suspension_temporal_por_dias(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_usuario())
        antes = datetime.now(timezone.utc)
        aplicar_accion(self.db, reporte, self.admin, AccionReporteEntrada(
            accion=AccionModeracion.SUSPENDER_USUARIO,
            motivo="Incumplimiento reiterado",
            tipo_suspension="temporal",
            duracion_suspension=2,
            unidad_suspension="dias",
        ))
        self.db.refresh(self.autor)
        self.assertGreaterEqual(
            self.autor.suspension_hasta.replace(tzinfo=timezone.utc),
            antes + timedelta(days=2),
        )

    @patch("app.services.moderacion_service.settings.limite_reportes_diarios", 20)
    def test_suspension_indefinida_no_guarda_vencimiento(self):
        reporte = crear_reporte(self.db, self.reportante, self._datos_usuario())
        aplicar_accion(self.db, reporte, self.admin, AccionReporteEntrada(
            accion=AccionModeracion.SUSPENDER_USUARIO,
            motivo="Incumplimiento reiterado",
            tipo_suspension="indefinida",
        ))
        self.db.refresh(self.autor)
        self.assertIsNone(self.autor.suspension_hasta)
        auditoria = self.db.scalar(select(AuditoriaModeracion).where(
            AuditoriaModeracion.accion == AccionModeracion.SUSPENDER_USUARIO
        ))
        self.assertIsNotNone(auditoria.suspension_inicio)
        self.assertIsNone(auditoria.suspension_fin)

    def test_contador_y_filtro_comparten_criterio_de_suspension_vigente(self):
        futuro = crear_usuario(self.db, "futuro")
        vencido = crear_usuario(self.db, "vencido")
        self.autor.estado = EstadoUsuario.SUSPENDIDO
        self.autor.suspension_hasta = None
        futuro.estado = EstadoUsuario.SUSPENDIDO
        futuro.suspension_hasta = datetime.now(timezone.utc) + timedelta(hours=1)
        vencido.estado = EstadoUsuario.SUSPENDIDO
        vencido.suspension_hasta = datetime.now(timezone.utc) - timedelta(hours=1)
        self.db.commit()

        resumen = obtener_resumen(self.db, self.admin)
        pagina = listar_usuarios(
            self.db, self.admin, buscar=None, estado="suspendidos", pagina=1, por_pagina=20
        )

        self.assertEqual(resumen.usuarios_suspendidos, 2)
        self.assertEqual(pagina.total, 2)
        self.assertEqual({item.nombre_usuario for item in pagina.items}, {"autor", "futuro"})

    def test_solo_principal_puede_crear_administradores(self):
        with self.assertRaisesRegex(ConflictoModeracionError, "principal"):
            crear_administrador(self.db, self.admin, AdministradorCreacion(
                nombre="Nuevo", apellido="Admin", nombre_usuario="nuevo.admin",
                email="nuevo.admin@example.com", password="Password-segura-123",
            ))

    def test_administrador_no_tiene_perfil_social_ni_aparece_en_busquedas(self):
        with self.assertRaises(UsuarioNoEncontradoError):
            obtener_perfil_publico(self.db, self.admin.id)
        resultado = buscar_usuarios(self.db, "admin", 20, 0)
        self.assertNotIn(self.admin.id, {usuario.id for usuario in resultado.usuarios})


if __name__ == "__main__":
    unittest.main()
