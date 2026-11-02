BEGIN;

ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS reputacion numeric(3,2) NOT NULL DEFAULT 0;

DO $$ BEGIN
    ALTER TABLE public.usuarios
        ADD CONSTRAINT chk_usuarios_reputacion
            CHECK (reputacion >= 0 AND reputacion <= 5);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Inicializa el promedio de estrellas recibidas. Las reseñas ocultas cuentan;
-- las eliminadas no cuentan aunque existan datos históricos inconsistentes.
UPDATE public.usuarios AS usuario
SET reputacion = COALESCE((
    SELECT ROUND(AVG(calificacion.calificacion), 2)
    FROM public.resenas AS resena
    JOIN public.calificaciones_resenas AS calificacion
      ON calificacion.resena_id = resena.id
    WHERE resena.usuario_id = usuario.id
      AND resena.resena_padre_id IS NULL
      AND resena.estado <> 'eliminada'::public.estado_resena
), 0);

COMMIT;
