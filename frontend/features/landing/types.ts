/** Ficha destacada del carrusel "Joyas de la cartelera". */
export type FeaturedTitle = {
  id: string;
  title: string;
  rating: number;
  genre: string;
  /** Ruta en /public. Mientras no exista el arte final se pinta el degradado. */
  poster?: string;
  /** Degradado de respaldo cuando todavía no hay póster. */
  posterGradient: string;
};

/** Tarjeta de la grilla "Tendencias de la Semana". */
export type TrendingTitle = {
  id: string;
  title: string;
  rating: number;
  year: number;
  kind: "Película" | "Serie";
  poster?: string;
  posterGradient: string;
};

/** Beneficio corto que se muestra bajo el hero. */
export type ValueProp = {
  id: string;
  title: string;
  description: string;
};

export type NavLink = {
  label: string;
  href: string;
};
