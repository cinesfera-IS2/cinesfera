import type { FiltrosCatalogo } from "@/features/catalog/types";

/**
 * Construye los parámetros de búsqueda para el endpoint del catálogo.
 *
 * El formulario utiliza "q", pero el backend espera "search".
 */
export function parametrosBusquedaCatalogo(
  filtros: FiltrosCatalogo
): URLSearchParams {
  const params = new URLSearchParams();

  const texto = filtros.texto?.trim();

  if (texto) {
    params.set("search", texto);
  }

  if (filtros.tipo) {
    params.set(
      "content_type",
      filtros.tipo === "pelicula" ? "movie" : "series"
    );
  }

  // El backend solo aplica el año cuando no hay búsqueda por nombre.
  if (filtros.anioEstreno && !texto) {
    params.set("year", String(filtros.anioEstreno));
  }

  return params;
}