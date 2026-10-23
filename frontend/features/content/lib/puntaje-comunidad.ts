import type { ResenaContenido } from "@/features/content/types";

export type PuntajeComunidad = {
  /** De 0 a 5, redondeado a un decimal. */
  promedio: number;
  cantidad: number;
};

/**
 * Promedia solo las reseñas principales: una respuesta comenta otra reseña,
 * así que su calificación no es una opinión nueva sobre la obra. Las que
 * quedaron sin nota tampoco cuentan.
 */
export function puntajeComunidad(
  resenas: ResenaContenido[]
): PuntajeComunidad | null {
  const calificaciones = resenas
    .filter((resena) => !resena.resena_padre_id)
    .map((resena) => resena.calificacion)
    .filter((calificacion): calificacion is number => calificacion !== null);

  if (calificaciones.length === 0) return null;

  const suma = calificaciones.reduce((total, calificacion) => total + calificacion, 0);

  return {
    promedio: Math.round((suma / calificaciones.length) * 10) / 10,
    cantidad: calificaciones.length,
  };
}
