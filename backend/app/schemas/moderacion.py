from datetime import datetime
from uuid import UUID

from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.core.enums import (
    AccionModeracion,
    EstadoReporte,
    EstadoResena,
    EstadoUsuario,
    MotivoReporte,
    TipoReporte,
)


class ReporteCreacion(BaseModel):
    tipo: TipoReporte
    objetivo_id: UUID
    motivo: MotivoReporte
    descripcion: str | None = Field(default=None, max_length=1000)


class ReporteCreadoRespuesta(BaseModel):
    id: UUID
    estado: EstadoReporte
    mensaje: str = "Reporte recibido. El contenido no se modificó automáticamente."


class ReporteActualizacion(BaseModel):
    estado: EstadoReporte
    resolucion: str | None = Field(default=None, max_length=2000)
    nota_interna: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def validar_resolucion(self):
        if self.estado == EstadoReporte.RESUELTO and not self.resolucion:
            raise ValueError("Una resolución requiere una descripción")
        return self


class AccionReporteEntrada(BaseModel):
    accion: AccionModeracion
    motivo: str = Field(min_length=3, max_length=1000)
    nota_interna: str | None = Field(default=None, max_length=2000)
    tipo_suspension: Literal["temporal", "indefinida"] | None = None
    duracion_suspension: int | None = Field(default=None, ge=1, le=24 * 365)
    unidad_suspension: Literal["horas", "dias"] | None = None
    ocultar_contenido: bool = True

    @field_validator("motivo")
    @classmethod
    def validar_motivo(cls, valor: str) -> str:
        valor = valor.strip()
        if len(valor) < 3:
            raise ValueError("El motivo debe tener al menos 3 caracteres")
        return valor

    @model_validator(mode="after")
    def validar_suspension(self):
        if self.accion != AccionModeracion.SUSPENDER_USUARIO:
            return self
        if self.tipo_suspension is None:
            raise ValueError("Seleccioná el tipo de suspensión")
        if self.tipo_suspension == "temporal":
            if self.duracion_suspension is None or self.unidad_suspension is None:
                raise ValueError("La suspensión temporal requiere duración y unidad")
            if self.unidad_suspension == "dias" and self.duracion_suspension > 365:
                raise ValueError("La suspensión temporal no puede superar 365 días")
        return self


class ReporteAdminRespuesta(BaseModel):
    id: UUID
    tipo: TipoReporte
    motivo: MotivoReporte
    descripcion: str | None
    contenido_snapshot: str
    estado: EstadoReporte
    reportante_id: UUID
    reportante_usuario: str
    objetivo_id: UUID
    objetivo_usuario: str | None
    administrador_id: UUID | None
    resolucion: str | None
    nota_interna: str | None
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    cantidad_reportes_objetivo: int
    reportes_descartados_reportante: int


class DenuncianteReporteRespuesta(BaseModel):
    id: UUID
    usuario: str
    motivo: MotivoReporte
    descripcion: str | None
    fecha: datetime


class ReportesPagina(BaseModel):
    items: list[ReporteAdminRespuesta]
    total: int
    pagina: int
    por_pagina: int


class ResumenModeracion(BaseModel):
    pendientes: int
    en_revision: int
    resueltos: int
    descartados: int
    usuarios_suspendidos: int


class AuditoriaRespuesta(BaseModel):
    id: UUID
    administrador_id: UUID
    administrador_usuario: str
    accion: AccionModeracion
    tipo_objetivo: str
    objetivo_id: UUID
    reporte_id: UUID | None
    estado_anterior: str | None
    estado_nuevo: str | None
    motivo: str
    nota_interna: str | None
    suspension_inicio: datetime | None
    suspension_fin: datetime | None
    fecha: datetime


class ReporteDetalleRespuesta(ReporteAdminRespuesta):
    denunciantes: list[DenuncianteReporteRespuesta]
    historial: list[AuditoriaRespuesta]
    estado_objetivo_usuario: EstadoUsuario | None
    estado_contenido: EstadoResena | None
    objetivo_nombre: str | None
    objetivo_apellido: str | None
    objetivo_usuario_id: UUID | None


class AuditoriaPagina(BaseModel):
    items: list[AuditoriaRespuesta]
    total: int
    pagina: int
    por_pagina: int


class AdministradorCreacion(BaseModel):
    nombre: str = Field(min_length=2, max_length=50)
    apellido: str = Field(min_length=2, max_length=50)
    nombre_usuario: str = Field(min_length=3, max_length=30, pattern=r"^[a-z0-9._]+$")
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class UsuarioAdminResumen(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    nombre_usuario: str
    email: EmailStr
    rol: str
    estado: str
    es_admin_principal: bool
    suspension_hasta: datetime | None
    motivo_suspension: str | None
    ocultar_contenido: bool
    cantidad_reportes: int


class UsuariosAdminPagina(BaseModel):
    items: list[UsuarioAdminResumen]
    total: int
    pagina: int
    por_pagina: int
