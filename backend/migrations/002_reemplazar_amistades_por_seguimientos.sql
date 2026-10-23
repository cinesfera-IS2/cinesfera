BEGIN;

CREATE TABLE IF NOT EXISTS public.seguimientos (
    seguidor_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    seguido_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    fecha_seguimiento timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pk_seguimientos PRIMARY KEY (seguidor_id, seguido_id),
    CONSTRAINT ck_seguimientos_usuarios_distintos
        CHECK (seguidor_id <> seguido_id)
);

CREATE INDEX IF NOT EXISTS ix_seguimientos_seguido_id
    ON public.seguimientos (seguido_id);

-- La aplicación accede mediante el backend y su conexión PostgreSQL. No se
-- crean políticas para anon/authenticated: esos roles no deben leer ni
-- modificar seguimientos directamente mediante la API de Supabase.
ALTER TABLE public.seguimientos ENABLE ROW LEVEL SECURITY;

-- Una amistad aceptada equivale a dos seguimientos, uno por dirección. El
-- bloque también permite aplicar la migración en instalaciones nuevas donde
-- la tabla de amistades nunca llegó a existir.
DO $$
BEGIN
    IF to_regclass('public.amistades') IS NOT NULL THEN
        INSERT INTO public.seguimientos (
            seguidor_id,
            seguido_id,
            fecha_seguimiento
        )
        SELECT
            usuario_id_1,
            usuario_id_2,
            COALESCE(fecha_respuesta, fecha_solicitud, now())
        FROM public.amistades
        WHERE estado::text = 'aceptada'
        ON CONFLICT DO NOTHING;

        INSERT INTO public.seguimientos (
            seguidor_id,
            seguido_id,
            fecha_seguimiento
        )
        SELECT
            usuario_id_2,
            usuario_id_1,
            COALESCE(fecha_respuesta, fecha_solicitud, now())
        FROM public.amistades
        WHERE estado::text = 'aceptada'
        ON CONFLICT DO NOTHING;

        DROP TABLE public.amistades;
    END IF;
END $$;

DROP TYPE IF EXISTS public.estado_amistad;

COMMIT;
