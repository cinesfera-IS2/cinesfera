-- Rediseño de reseñas de Cinesfera.
-- Una reseña original tiene calificación de película.
-- Las valoraciones comunitarias se almacenan independientemente.
-- Los comentarios pueden no tener calificación.

-- Permitir comentarios sin estrellas.
ALTER TABLE public.resenas
ALTER COLUMN calificacion DROP NOT NULL;

-- Valoraciones de la comunidad sobre reseñas originales.
CREATE TABLE IF NOT EXISTS public.calificaciones_resenas (
    usuario_id UUID NOT NULL
        REFERENCES public.usuarios(id)
        ON DELETE CASCADE,

    resena_id UUID NOT NULL
        REFERENCES public.resenas(id)
        ON DELETE CASCADE,

    calificacion NUMERIC(2,1) NOT NULL,

    fecha_actualizacion TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_calificaciones_resenas
        PRIMARY KEY (usuario_id, resena_id),

    CONSTRAINT chk_calificaciones_resenas_rango
        CHECK (
            calificacion >= 0.5
            AND calificacion <= 5
            AND MOD(calificacion * 10, 5) = 0
        )
);

CREATE INDEX IF NOT EXISTS ix_calificaciones_resenas_resena_id
ON public.calificaciones_resenas (resena_id);
