export const GENEROS = [
  { slug: "accion", nombre: "Acción" },
  { slug: "aventura", nombre: "Aventura" },
  { slug: "animacion", nombre: "Animación" },
  { slug: "ciencia-ficcion", nombre: "Ciencia ficción" },
  { slug: "comedia", nombre: "Comedia" },
  { slug: "crimen", nombre: "Crimen" },
  { slug: "drama", nombre: "Drama" },
  { slug: "fantasia", nombre: "Fantasía" },
  { slug: "historia", nombre: "Historia" },
  { slug: "romance", nombre: "Romance" },
  { slug: "terror", nombre: "Terror" },
  { slug: "thriller", nombre: "Thriller" },
] as const;

export type GeneroSlug = (typeof GENEROS)[number]["slug"];

export const TIPOS = [
  { valor: "pelicula", etiqueta: "Películas" },
  { valor: "serie", etiqueta: "Series" },
] as const;

export type TipoObra = (typeof TIPOS)[number]["valor"];

/** Límite inferior del filtro por año de estreno. */
export const ANIO_MINIMO = 1900;

/** TMDB no deja pedir páginas más allá de esta. */
export const PAGINA_MAXIMA = 500;

export const ORDENES = [
  { valor: "populares", etiqueta: "Más populares" },
  { valor: "calificacion", etiqueta: "Mejor calificadas" },
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "titulo", etiqueta: "Título (A–Z)" },
] as const;

export type Orden = (typeof ORDENES)[number]["valor"];

/** Una película o una serie del catálogo. */
export type Obra = {
  tmdbId: number;
  tipo: TipoObra;
  titulo: string;
  /** `AAAA-MM-DD`. En las series es la fecha del primer episodio. */
  fechaEstreno: string | null;
  poster?: string;
  /** Degradado de respaldo para las obras que TMDB no tiene con póster. */
  posterGradient: string;
};

export type FiltrosCatalogo = {
  texto?: string;
  genero?: GeneroSlug;
  tipo?: TipoObra;
  anioEstreno?: number;
  orden: Orden;
  pagina: number;
};

export type PaginaCatalogo = {
  obras: Obra[];
  pagina: number;
  totalPaginas: number;
};
