-- Agregar columna resena_padre_id a la tabla resenas.
ALTER TABLE public.resenas
ADD COLUMN IF NOT EXISTS resena_padre_id uuid
REFERENCES public.resenas(id)
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ix_resenas_resena_padre_id
ON public.resenas (resena_padre_id);
