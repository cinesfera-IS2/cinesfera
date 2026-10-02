import type {
  FiltrosCatalogo,
  Obra,
  PaginaCatalogo,
} from "@/features/catalog/types";

/** Minúsculas y sin tildes, para que "accion" encuentre "Acción". */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function anioDeEstreno(obra: Obra): number {
  return Number(obra.fechaEstreno.slice(0, 4));
}

const COMPARADORES: Record<
  FiltrosCatalogo["orden"],
  (a: Obra, b: Obra) => number
> = {
  populares: (a, b) => b.popularidad - a.popularidad,
  calificacion: (a, b) => b.calificacion - a.calificacion,
  recientes: (a, b) => b.fechaEstreno.localeCompare(a.fechaEstreno),
  titulo: (a, b) => a.titulo.localeCompare(b.titulo, "es"),
};

export function filtrarObras(
  obras: Obra[],
  filtros: FiltrosCatalogo,
  porPagina: number
): PaginaCatalogo {
  const texto = filtros.texto && normalizar(filtros.texto);

  const coincidencias = obras
    .filter(
      (obra) =>
        (!texto || normalizar(obra.titulo).includes(texto)) &&
        (!filtros.genero || obra.generos.includes(filtros.genero)) &&
        (!filtros.tipo || obra.tipo === filtros.tipo) &&
        (!filtros.anioEstreno || anioDeEstreno(obra) === filtros.anioEstreno)
    )
    .sort(COMPARADORES[filtros.orden]);

  const totalPaginas = Math.max(1, Math.ceil(coincidencias.length / porPagina));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const inicio = (pagina - 1) * porPagina;

  return {
    obras: coincidencias.slice(inicio, inicio + porPagina),
    total: coincidencias.length,
    pagina,
    totalPaginas,
    porPagina,
  };
}
