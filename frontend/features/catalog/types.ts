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

export const ORDENES = [
  { valor: "populares", etiqueta: "Más populares" },
  { valor: "calificacion", etiqueta: "Mejor calificadas" },
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "titulo", etiqueta: "Título (A–Z)" },
] as const;

export type Orden = (typeof ORDENES)[number]["valor"];

/** Una película o una serie del catálogo. */
export type Obra = {
  id: string;
  tipo: TipoObra;
  titulo: string;
  /** `AAAA-MM-DD`. En las series es la fecha del primer episodio. */
  fechaEstreno: string;
  /** El primero es el que se muestra en la ficha. */
  generos: GeneroSlug[];
  /** Promedio de la comunidad, de 0 a 5. */
  calificacion: number;
  popularidad: number;
  poster?: string;
  /** Degradado de respaldo mientras no haya póster real. */
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
  total: number;
  /** Puede diferir de la pedida si esa se pasaba de la última. */
  pagina: number;
  totalPaginas: number;
  porPagina: number;
};
