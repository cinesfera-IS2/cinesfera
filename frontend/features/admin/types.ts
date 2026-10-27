export type EstadoReporte = "pendiente" | "en_revision" | "resuelto" | "descartado";
export type TipoReporte = "comentario" | "usuario";

export type ReporteAdmin = {
  id: string;
  tipo: TipoReporte;
  motivo: string;
  descripcion: string | null;
  contenido_snapshot: string;
  estado: EstadoReporte;
  reportante_id: string;
  reportante_usuario: string;
  objetivo_id: string;
  objetivo_usuario: string | null;
  administrador_id: string | null;
  resolucion: string | null;
  nota_interna: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
  cantidad_reportes_objetivo: number;
  reportes_descartados_reportante: number;
};

export type Pagina<T> = {
  items: T[];
  total: number;
  pagina: number;
  por_pagina: number;
};

export type ResumenAdmin = {
  pendientes: number;
  en_revision: number;
  resueltos: number;
  descartados: number;
  usuarios_suspendidos: number;
};

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  rol: "usuario" | "admin";
  estado: "activo" | "suspendido" | "eliminado";
  es_admin_principal: boolean;
  suspension_hasta: string | null;
  motivo_suspension: string | null;
  ocultar_contenido: boolean;
  cantidad_reportes: number;
};

export type Auditoria = {
  id: string;
  administrador_usuario: string;
  accion: string;
  tipo_objetivo: string;
  objetivo_id: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  motivo: string;
  nota_interna: string | null;
  fecha: string;
};
