BEGIN;

-- Repara eliminaciones anteriores a la propagacion en cascada. UNION evita
-- duplicados si ya hay mas de una reseña eliminada dentro del mismo arbol.
WITH RECURSIVE arbol_eliminado(id) AS (
    SELECT id
    FROM public.resenas
    WHERE estado = 'eliminada'::public.estado_resena

    UNION

    SELECT respuesta.id
    FROM public.resenas AS respuesta
    JOIN arbol_eliminado AS padre ON respuesta.resena_padre_id = padre.id
)
DELETE FROM public.calificaciones_resenas AS calificacion
WHERE calificacion.resena_id IN (SELECT id FROM arbol_eliminado)
   OR EXISTS (
       SELECT 1
       FROM public.resenas AS respuesta
       WHERE respuesta.id IN (SELECT id FROM arbol_eliminado)
         AND respuesta.resena_padre_id = calificacion.resena_id
         AND respuesta.usuario_id = calificacion.usuario_id
         AND respuesta.calificacion IS NOT NULL
   );

WITH RECURSIVE arbol_eliminado(id) AS (
    SELECT id
    FROM public.resenas
    WHERE estado = 'eliminada'::public.estado_resena

    UNION

    SELECT respuesta.id
    FROM public.resenas AS respuesta
    JOIN arbol_eliminado AS padre ON respuesta.resena_padre_id = padre.id
)
DELETE FROM public.valoraciones_resena
WHERE resena_id IN (SELECT id FROM arbol_eliminado);

WITH RECURSIVE arbol_eliminado(id) AS (
    SELECT id
    FROM public.resenas
    WHERE estado = 'eliminada'::public.estado_resena

    UNION

    SELECT respuesta.id
    FROM public.resenas AS respuesta
    JOIN arbol_eliminado AS padre ON respuesta.resena_padre_id = padre.id
)
UPDATE public.resenas
SET estado = 'eliminada'::public.estado_resena
WHERE id IN (SELECT id FROM arbol_eliminado);

COMMIT;
