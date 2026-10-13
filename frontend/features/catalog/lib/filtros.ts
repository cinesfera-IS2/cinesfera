import {
  ANIO_MINIMO,
  GENEROS,
  ORDENES,
  TIPOS,
  type FiltrosCatalogo,
  type GeneroSlug,
  type Orden,
  type TipoObra,
} from "@/features/catalog/types";

type SearchParams = Record<string, string | string[] | undefined>;

const ORDEN_POR_DEFECTO: Orden = "populares";

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function esGenero(valor: string | undefined): valor is GeneroSlug {
  return GENEROS.some((genero) => genero.slug === valor);
}

function esOrden(valor: string | undefined): valor is Orden {
  return ORDENES.some((orden) => orden.valor === valor);
}

function esTipo(valor: string | undefined): valor is TipoObra {
  return TIPOS.some((tipo) => tipo.valor === valor);
}

function leerAnio(valor: string | undefined): number | undefined {
  const anio = Number(valor);
  return /^\d{4}$/.test(valor ?? "") && anio >= ANIO_MINIMO ? anio : undefined;
}

/**
 * Traduce la URL a filtros válidos. Cualquier valor que no se reconozca se
 * descarta en lugar de romper la página, porque la URL la puede tocar a mano
 * cualquiera.
 */
export function leerFiltros(searchParams: SearchParams): FiltrosCatalogo {
  const texto = primero(searchParams.q)?.trim();
  const genero = primero(searchParams.genero);
  const tipo = primero(searchParams.tipo);
  const orden = primero(searchParams.orden);
  const pagina = Number(primero(searchParams.pagina));

  return {
    texto: texto || undefined,
    genero: esGenero(genero) ? genero : undefined,
    tipo: esTipo(tipo) ? tipo : undefined,
    anioEstreno: leerAnio(primero(searchParams.anio)),
    orden: esOrden(orden) ? orden : ORDEN_POR_DEFECTO,
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
}

/**
 * URL del catálogo con los filtros actuales más los `cambios`. Los valores por
 * defecto no se escriben, así la URL queda corta y compartible.
 */
export function hrefCatalogo(
  filtros: FiltrosCatalogo,
  cambios: Partial<FiltrosCatalogo> = {}
): string {
  const { texto, genero, tipo, anioEstreno, orden, pagina } = {
    ...filtros,
    ...cambios,
  };
  const params = new URLSearchParams();

  if (texto) params.set("q", texto);
  if (genero) params.set("genero", genero);
  if (tipo) params.set("tipo", tipo);
  if (anioEstreno) params.set("anio", String(anioEstreno));
  if (orden !== ORDEN_POR_DEFECTO) params.set("orden", orden);
  if (pagina > 1) params.set("pagina", String(pagina));

  const query = params.toString();
  return query ? `/catalogo?${query}` : "/catalogo";
}

export function hayFiltrosActivos(filtros: FiltrosCatalogo): boolean {
  return Boolean(
    filtros.texto ||
      filtros.genero ||
      filtros.tipo ||
      filtros.anioEstreno
  );
}

/**
 * Números de página a mostrar, con "…" donde se saltean. Siempre están la
 * primera, la última y las vecinas de la actual.
 */
export function paginasVisibles(
  actual: number,
  total: number
): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, indice) => indice + 1);
  }

  const desde = Math.max(2, Math.min(actual - 1, total - 4));
  const hasta = Math.min(total - 1, Math.max(actual + 1, 5));
  const medio = Array.from(
    { length: hasta - desde + 1 },
    (_, indice) => desde + indice
  );

  return [
    1,
    ...(desde > 2 ? ["…" as const] : []),
    ...medio,
    ...(hasta < total - 1 ? ["…" as const] : []),
    total,
  ];
}
