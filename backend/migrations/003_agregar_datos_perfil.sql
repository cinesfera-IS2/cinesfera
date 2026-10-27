BEGIN;

ALTER TABLE public.usuarios
    ADD COLUMN IF NOT EXISTS bio text,
    ADD COLUMN IF NOT EXISTS ubicacion varchar(100),
    ADD COLUMN IF NOT EXISTS generos_favoritos json NOT NULL DEFAULT '[]'::json;

COMMIT;
