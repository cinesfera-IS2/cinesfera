import type {
  FiltrosCatalogo,
  Obra,
  PaginaCatalogo,
  TipoObra,
} from "@/features/catalog/types";
import { apiFetch } from "@/lib/api";

/** Lo que trae TMDB por página para un solo tipo; con ambos tipos llegan el doble. */
export const OBRAS_POR_PAGINA = 20;

const DEGRADADOS = [
  "from-sky-500/35 via-night-800 to-night-950",
  "from-violet-600/40 via-night-800 to-night-950",
  "from-cyan-500/30 via-night-800 to-night-950",
  "from-teal-500/35 via-night-800 to-night-950",
  "from-rose-500/35 via-night-800 to-night-950",
  "from-amber-500/30 via-night-800 to-night-950",
];

type ContenidoApi = {
  title: string;
  content_type: "movie" | "series";
  release_date: string | null;
  summary: string | null;
  poster_url: string | null;
  tmdb_id: number;
};

type CatalogoApi = {
  contents: ContenidoApi[];
  total_pages: number;
};

const TIPO_API: Record<TipoObra, ContenidoApi["content_type"]> = {
  pelicula: "movie",
  serie: "series",
};

function aObra(contenido: ContenidoApi, indice: number): Obra {
  return {
    tmdbId: contenido.tmdb_id,
    tipo: contenido.content_type === "series" ? "serie" : "pelicula",
    titulo: contenido.title,
    fechaEstreno: contenido.release_date || null,
    poster: contenido.poster_url ?? undefined,
    posterGradient: DEGRADADOS[indice % DEGRADADOS.length],
  };
}

/** El género y el orden todavía no los soporta el backend, así que no se mandan. */
export async function buscarObras(
  filtros: FiltrosCatalogo
): Promise<PaginaCatalogo> {
  const params = new URLSearchParams({ page: String(filtros.pagina) });

  if (filtros.texto) params.set("search", filtros.texto);
  if (filtros.tipo) params.set("content_type", TIPO_API[filtros.tipo]);
  if (filtros.anioEstreno) params.set("year", String(filtros.anioEstreno));

  const respuesta = await apiFetch<CatalogoApi>(`/catalogue/?${params}`, {
    cache: "no-store",
  });

  return {
    obras: respuesta.contents.map(aObra),
    pagina: filtros.pagina,
    totalPaginas: respuesta.total_pages,
  };
}
