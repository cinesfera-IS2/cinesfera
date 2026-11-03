CREATE TABLE IF NOT EXISTS public.fotos_perfil (
    usuario_id UUID PRIMARY KEY
        REFERENCES public.usuarios(id) ON DELETE CASCADE,
    contenido BYTEA NOT NULL,
    tipo_mime VARCHAR(20) NOT NULL,
    actualizada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fotos_perfil_tipo_valido
        CHECK (tipo_mime IN ('image/jpeg', 'image/png', 'image/webp'))
);

-- Las imágenes se leen y escriben exclusivamente mediante FastAPI. RLS sin
-- políticas impide que `anon` y `authenticated` accedan directamente a los
-- binarios mediante la API de datos de Supabase. La conexión del backend usa
-- el propietario de la tabla y no queda afectada.
ALTER TABLE public.fotos_perfil ENABLE ROW LEVEL SECURITY;
