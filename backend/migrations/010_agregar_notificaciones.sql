CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL
        REFERENCES public.usuarios(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL
        REFERENCES public.usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT false,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT notificaciones_tipo_valido
        CHECK (tipo IN ('nuevo_seguidor')),
    CONSTRAINT notificaciones_usuarios_distintos
        CHECK (usuario_id <> actor_id)
);

CREATE INDEX IF NOT EXISTS ix_notificaciones_usuario_fecha
    ON public.notificaciones (usuario_id, fecha DESC);

CREATE INDEX IF NOT EXISTS ix_notificaciones_usuario_no_leidas
    ON public.notificaciones (usuario_id)
    WHERE leida = false;

-- Las notificaciones solo se consultan mediante FastAPI; no se exponen por
-- la API de datos de Supabase.
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
