-- Moderación, reportes y auditoría. Ejecutar una vez sobre instalaciones existentes.
DO $$ BEGIN
    CREATE TYPE public.tipo_reporte AS ENUM ('comentario', 'usuario');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public.motivo_reporte AS ENUM (
        'spam', 'acoso', 'odio', 'contenido_inapropiado',
        'suplantacion', 'informacion_falsa', 'otro'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public.estado_reporte AS ENUM (
        'pendiente', 'en_revision', 'resuelto', 'descartado'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public.estado_resena AS ENUM ('visible', 'oculta', 'eliminada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public.accion_moderacion AS ENUM (
        'ocultar_comentario', 'restaurar_comentario', 'eliminar_comentario',
        'suspender_usuario', 'reactivar_usuario', 'eliminar_usuario',
        'crear_admin', 'revocar_admin', 'actualizar_reporte'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS es_admin_principal boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS suspension_hasta timestamptz,
    ADD COLUMN IF NOT EXISTS motivo_suspension text,
    ADD COLUMN IF NOT EXISTS ocultar_contenido boolean NOT NULL DEFAULT false;

ALTER TABLE public.resenas
    ADD COLUMN IF NOT EXISTS estado public.estado_resena NOT NULL DEFAULT 'visible';

CREATE TABLE IF NOT EXISTS public.reportes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reportante_id uuid NOT NULL REFERENCES public.usuarios(id),
    tipo public.tipo_reporte NOT NULL,
    objetivo_clave varchar(80) NOT NULL,
    usuario_reportado_id uuid REFERENCES public.usuarios(id),
    resena_reportada_id uuid REFERENCES public.resenas(id),
    motivo public.motivo_reporte NOT NULL,
    descripcion text,
    contenido_snapshot text NOT NULL,
    estado public.estado_reporte NOT NULL DEFAULT 'pendiente',
    administrador_id uuid REFERENCES public.usuarios(id),
    resolucion text,
    nota_interna text,
    fecha_creacion timestamptz NOT NULL DEFAULT now(),
    fecha_actualizacion timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_reporte_reportante_objetivo UNIQUE (reportante_id, objetivo_clave),
    CONSTRAINT ck_reporte_objetivo CHECK (
        (tipo = 'usuario' AND usuario_reportado_id IS NOT NULL AND resena_reportada_id IS NULL)
        OR
        (tipo = 'comentario' AND resena_reportada_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS public.auditoria_moderacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    administrador_id uuid NOT NULL REFERENCES public.usuarios(id),
    accion public.accion_moderacion NOT NULL,
    tipo_objetivo varchar(30) NOT NULL,
    objetivo_id uuid NOT NULL,
    reporte_id uuid REFERENCES public.reportes(id),
    estado_anterior text,
    estado_nuevo text,
    motivo text NOT NULL,
    nota_interna text,
    fecha timestamptz NOT NULL DEFAULT now()
);

-- Estas tablas contienen denuncias, notas internas y decisiones sensibles.
-- La aplicación las consulta únicamente mediante FastAPI; nunca mediante las
-- claves públicas de Supabase. RLS sin políticas bloquea la Data API y los
-- REVOKE evitan que anon/authenticated conserven privilegios heredados.
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_moderacion ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.reportes
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.auditoria_moderacion
    FROM PUBLIC, anon, authenticated;

-- Conserva el acceso de procesos server-side que usen la service role.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reportes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.auditoria_moderacion TO service_role;

CREATE INDEX IF NOT EXISTS ix_reportes_estado_fecha
    ON public.reportes (estado, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS ix_reportes_motivo ON public.reportes (motivo);
CREATE INDEX IF NOT EXISTS ix_reportes_tipo ON public.reportes (tipo);
CREATE INDEX IF NOT EXISTS ix_reportes_usuario_reportado
    ON public.reportes (usuario_reportado_id);
CREATE INDEX IF NOT EXISTS ix_reportes_resena_reportada
    ON public.reportes (resena_reportada_id);
CREATE INDEX IF NOT EXISTS ix_auditoria_fecha
    ON public.auditoria_moderacion (fecha DESC);

-- El primer admin creado por ADMIN_INICIAL_* queda marcado desde la aplicación.
-- Si ya existía uno antes de esta migración, se promueve el más antiguo.
UPDATE public.usuarios
SET es_admin_principal = true
WHERE id = (
    SELECT id FROM public.usuarios
    WHERE rol = 'admin'
    ORDER BY fecha_registro ASC
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM public.usuarios WHERE es_admin_principal = true
);
