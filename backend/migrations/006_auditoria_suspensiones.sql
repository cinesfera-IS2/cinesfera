-- Datos temporales de las suspensiones para una auditoría completa.
ALTER TABLE public.auditoria_moderacion
    ADD COLUMN IF NOT EXISTS suspension_inicio timestamptz,
    ADD COLUMN IF NOT EXISTS suspension_fin timestamptz;

COMMENT ON COLUMN public.auditoria_moderacion.suspension_inicio IS
    'Instante UTC en que comenzó la suspensión, si la acción corresponde.';
COMMENT ON COLUMN public.auditoria_moderacion.suspension_fin IS
    'Instante UTC de vencimiento; NULL representa una suspensión indefinida.';
