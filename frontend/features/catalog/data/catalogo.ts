import { OBRAS } from "@/features/catalog/data/obras";
import { filtrarObras } from "@/features/catalog/lib/buscar";
import type { FiltrosCatalogo, PaginaCatalogo } from "@/features/catalog/types";

/** Múltiplo de 2, 4 y 5: llena todas las filas de la grilla en cualquier ancho. */
export const OBRAS_POR_PAGINA = 20;

/**
 * Por ahora filtra el catálogo de ejemplo en memoria. Cuando exista el
 * endpoint, esta función pasa a llamarlo con los mismos filtros y el resto de
 * la pantalla no cambia.
 */
export async function buscarObras(
  filtros: FiltrosCatalogo
): Promise<PaginaCatalogo> {
  return filtrarObras(OBRAS, filtros, OBRAS_POR_PAGINA);
}
