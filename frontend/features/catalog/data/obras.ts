import type { Obra } from "@/features/catalog/types";

const DEGRADADOS = [
  "from-sky-500/35 via-night-800 to-night-950",
  "from-violet-600/40 via-night-800 to-night-950",
  "from-cyan-500/30 via-night-800 to-night-950",
  "from-teal-500/35 via-night-800 to-night-950",
  "from-rose-500/35 via-night-800 to-night-950",
  "from-amber-500/30 via-night-800 to-night-950",
];

/**
 * Catálogo de ejemplo hasta que el backend exponga las películas y series de
 * TMDB. La popularidad es inventada: solo sirve para que el orden por defecto
 * tenga sentido.
 */
const DATOS: Omit<Obra, "posterGradient">[] = [
  { id: "parasitos", tipo: "pelicula", titulo: "Parásitos", fechaEstreno: "2019-05-30", generos: ["thriller", "drama"], calificacion: 4.6, popularidad: 97 },
  { id: "interestelar", tipo: "pelicula", titulo: "Interestelar", fechaEstreno: "2014-11-07", generos: ["ciencia-ficcion", "drama", "aventura"], calificacion: 4.5, popularidad: 99 },
  { id: "el-padrino", tipo: "pelicula", titulo: "El Padrino", fechaEstreno: "1972-03-24", generos: ["crimen", "drama"], calificacion: 4.7, popularidad: 90 },
  { id: "pulp-fiction", tipo: "pelicula", titulo: "Pulp Fiction", fechaEstreno: "1994-10-14", generos: ["crimen", "thriller"], calificacion: 4.4, popularidad: 88 },
  { id: "el-viaje-de-chihiro", tipo: "pelicula", titulo: "El viaje de Chihiro", fechaEstreno: "2001-07-20", generos: ["animacion", "fantasia", "aventura"], calificacion: 4.6, popularidad: 86 },
  { id: "mad-max-furia-en-el-camino", tipo: "pelicula", titulo: "Mad Max: Furia en el camino", fechaEstreno: "2015-05-15", generos: ["accion", "aventura", "ciencia-ficcion"], calificacion: 4.2, popularidad: 80 },
  { id: "todo-en-todas-partes", tipo: "pelicula", titulo: "Todo en todas partes al mismo tiempo", fechaEstreno: "2022-03-25", generos: ["ciencia-ficcion", "comedia", "accion"], calificacion: 4.1, popularidad: 78 },
  { id: "el-secreto-de-sus-ojos", tipo: "pelicula", titulo: "El secreto de sus ojos", fechaEstreno: "2009-08-13", generos: ["thriller", "drama", "crimen"], calificacion: 4.4, popularidad: 74 },
  { id: "relatos-salvajes", tipo: "pelicula", titulo: "Relatos salvajes", fechaEstreno: "2014-08-21", generos: ["comedia", "drama", "thriller"], calificacion: 4.2, popularidad: 76 },
  { id: "whiplash", tipo: "pelicula", titulo: "Whiplash", fechaEstreno: "2014-10-10", generos: ["drama"], calificacion: 4.5, popularidad: 84 },
  { id: "oppenheimer", tipo: "pelicula", titulo: "Oppenheimer", fechaEstreno: "2023-07-21", generos: ["historia", "drama"], calificacion: 4.3, popularidad: 95 },
  { id: "dune-parte-dos", tipo: "pelicula", titulo: "Dune: Parte dos", fechaEstreno: "2024-03-01", generos: ["ciencia-ficcion", "aventura"], calificacion: 4.3, popularidad: 98 },
  { id: "la-la-land", tipo: "pelicula", titulo: "La La Land", fechaEstreno: "2016-12-09", generos: ["romance", "drama"], calificacion: 4.0, popularidad: 79 },
  { id: "coco", tipo: "pelicula", titulo: "Coco", fechaEstreno: "2017-11-22", generos: ["animacion", "fantasia", "aventura"], calificacion: 4.3, popularidad: 82 },
  { id: "el-laberinto-del-fauno", tipo: "pelicula", titulo: "El laberinto del fauno", fechaEstreno: "2006-10-11", generos: ["fantasia", "drama"], calificacion: 4.3, popularidad: 70 },
  { id: "hereditary", tipo: "pelicula", titulo: "Hereditary", fechaEstreno: "2018-06-08", generos: ["terror", "drama"], calificacion: 3.9, popularidad: 72 },
  { id: "huye", tipo: "pelicula", titulo: "¡Huye!", fechaEstreno: "2017-02-24", generos: ["terror", "thriller"], calificacion: 4.0, popularidad: 73 },
  { id: "alien", tipo: "pelicula", titulo: "Alien, el octavo pasajero", fechaEstreno: "1979-05-25", generos: ["terror", "ciencia-ficcion"], calificacion: 4.3, popularidad: 68 },
  { id: "volver-al-futuro", tipo: "pelicula", titulo: "Volver al futuro", fechaEstreno: "1985-07-03", generos: ["ciencia-ficcion", "aventura", "comedia"], calificacion: 4.4, popularidad: 83 },
  { id: "matrix", tipo: "pelicula", titulo: "Matrix", fechaEstreno: "1999-03-31", generos: ["ciencia-ficcion", "accion"], calificacion: 4.4, popularidad: 87 },
  { id: "el-caballero-de-la-noche", tipo: "pelicula", titulo: "El caballero de la noche", fechaEstreno: "2008-07-18", generos: ["accion", "crimen", "drama"], calificacion: 4.6, popularidad: 92 },
  { id: "amelie", tipo: "pelicula", titulo: "Amélie", fechaEstreno: "2001-04-25", generos: ["comedia", "romance"], calificacion: 4.1, popularidad: 66 },
  { id: "antes-del-amanecer", tipo: "pelicula", titulo: "Antes del amanecer", fechaEstreno: "1995-01-27", generos: ["romance", "drama"], calificacion: 4.1, popularidad: 58 },
  { id: "casablanca", tipo: "pelicula", titulo: "Casablanca", fechaEstreno: "1942-11-26", generos: ["romance", "drama"], calificacion: 4.3, popularidad: 55 },
  { id: "psicosis", tipo: "pelicula", titulo: "Psicosis", fechaEstreno: "1960-06-16", generos: ["terror", "thriller"], calificacion: 4.3, popularidad: 60 },
  { id: "2001-odisea-del-espacio", tipo: "pelicula", titulo: "2001: Odisea del espacio", fechaEstreno: "1968-04-02", generos: ["ciencia-ficcion", "aventura"], calificacion: 4.2, popularidad: 62 },
  { id: "ciudad-de-dios", tipo: "pelicula", titulo: "Ciudad de Dios", fechaEstreno: "2002-08-30", generos: ["crimen", "drama"], calificacion: 4.5, popularidad: 67 },
  { id: "25-watts", tipo: "pelicula", titulo: "25 Watts", fechaEstreno: "2001-01-26", generos: ["comedia", "drama"], calificacion: 3.8, popularidad: 41 },
  { id: "whisky", tipo: "pelicula", titulo: "Whisky", fechaEstreno: "2004-08-06", generos: ["comedia", "drama"], calificacion: 3.9, popularidad: 44 },
  { id: "la-sociedad-de-la-nieve", tipo: "pelicula", titulo: "La sociedad de la nieve", fechaEstreno: "2023-12-15", generos: ["drama", "aventura", "historia"], calificacion: 4.2, popularidad: 89 },
  { id: "toy-story", tipo: "pelicula", titulo: "Toy Story", fechaEstreno: "1995-11-22", generos: ["animacion", "comedia", "aventura"], calificacion: 4.2, popularidad: 77 },
  { id: "spider-man-spider-verso", tipo: "pelicula", titulo: "Spider-Man: A través del Spider-Verso", fechaEstreno: "2023-06-02", generos: ["animacion", "accion", "aventura"], calificacion: 4.4, popularidad: 91 },
  { id: "gladiador", tipo: "pelicula", titulo: "Gladiador", fechaEstreno: "2000-05-05", generos: ["accion", "drama", "historia"], calificacion: 4.2, popularidad: 81 },
  { id: "john-wick", tipo: "pelicula", titulo: "John Wick", fechaEstreno: "2014-10-24", generos: ["accion", "thriller"], calificacion: 3.9, popularidad: 75 },
  { id: "pobres-criaturas", tipo: "pelicula", titulo: "Pobres criaturas", fechaEstreno: "2023-12-08", generos: ["ciencia-ficcion", "comedia", "romance"], calificacion: 3.9, popularidad: 71 },
  { id: "retrato-de-una-mujer-en-llamas", tipo: "pelicula", titulo: "Retrato de una mujer en llamas", fechaEstreno: "2019-09-18", generos: ["romance", "drama", "historia"], calificacion: 4.3, popularidad: 57 },
  { id: "perfect-days", tipo: "pelicula", titulo: "Perfect Days", fechaEstreno: "2023-12-21", generos: ["drama"], calificacion: 4.2, popularidad: 63 },
  { id: "anatomia-de-una-caida", tipo: "pelicula", titulo: "Anatomía de una caída", fechaEstreno: "2023-08-23", generos: ["thriller", "drama", "crimen"], calificacion: 4.0, popularidad: 69 },
  { id: "el-resplandor", tipo: "pelicula", titulo: "El resplandor", fechaEstreno: "1980-05-23", generos: ["terror", "thriller"], calificacion: 4.3, popularidad: 76 },
  { id: "buscando-a-nemo", tipo: "pelicula", titulo: "Buscando a Nemo", fechaEstreno: "2003-05-30", generos: ["animacion", "aventura", "comedia"], calificacion: 4.0, popularidad: 73 },
  { id: "la-vida-es-bella", tipo: "pelicula", titulo: "La vida es bella", fechaEstreno: "1997-12-20", generos: ["comedia", "drama", "historia"], calificacion: 4.4, popularidad: 65 },
  { id: "el-club-de-la-pelea", tipo: "pelicula", titulo: "El club de la pelea", fechaEstreno: "1999-10-15", generos: ["drama", "thriller"], calificacion: 4.3, popularidad: 85 },
  { id: "breaking-bad", tipo: "serie", titulo: "Breaking Bad", fechaEstreno: "2008-01-20", generos: ["crimen", "drama", "thriller"], calificacion: 4.8, popularidad: 96 },
  { id: "dark", tipo: "serie", titulo: "Dark", fechaEstreno: "2017-12-01", generos: ["ciencia-ficcion", "thriller", "drama"], calificacion: 4.5, popularidad: 84 },
  { id: "stranger-things", tipo: "serie", titulo: "Stranger Things", fechaEstreno: "2016-07-15", generos: ["ciencia-ficcion", "terror", "drama"], calificacion: 4.2, popularidad: 94 },
  { id: "chernobyl", tipo: "serie", titulo: "Chernobyl", fechaEstreno: "2019-05-06", generos: ["historia", "drama"], calificacion: 4.7, popularidad: 83 },
  { id: "the-last-of-us", tipo: "serie", titulo: "The Last of Us", fechaEstreno: "2023-01-15", generos: ["drama", "aventura", "ciencia-ficcion"], calificacion: 4.3, popularidad: 93 },
  { id: "arcane", tipo: "serie", titulo: "Arcane", fechaEstreno: "2021-11-06", generos: ["animacion", "accion", "fantasia"], calificacion: 4.6, popularidad: 86 },
  { id: "la-casa-de-papel", tipo: "serie", titulo: "La casa de papel", fechaEstreno: "2017-05-02", generos: ["crimen", "thriller"], calificacion: 4.0, popularidad: 88 },
  { id: "succession", tipo: "serie", titulo: "Succession", fechaEstreno: "2018-06-03", generos: ["drama", "comedia"], calificacion: 4.5, popularidad: 74 },
  { id: "separacion", tipo: "serie", titulo: "Separación", fechaEstreno: "2022-02-18", generos: ["ciencia-ficcion", "thriller", "drama"], calificacion: 4.5, popularidad: 81 },
  { id: "el-oso", tipo: "serie", titulo: "El oso", fechaEstreno: "2022-06-23", generos: ["comedia", "drama"], calificacion: 4.3, popularidad: 72 },
  { id: "juego-de-tronos", tipo: "serie", titulo: "Juego de tronos", fechaEstreno: "2011-04-17", generos: ["fantasia", "drama", "aventura"], calificacion: 4.4, popularidad: 95 },
  { id: "friends", tipo: "serie", titulo: "Friends", fechaEstreno: "1994-09-22", generos: ["comedia", "romance"], calificacion: 4.2, popularidad: 87 },
  { id: "los-simpson", tipo: "serie", titulo: "Los Simpson", fechaEstreno: "1989-12-17", generos: ["animacion", "comedia"], calificacion: 4.1, popularidad: 85 },
];

export const OBRAS: Obra[] = DATOS.map((obra, indice) => ({
  ...obra,
  posterGradient: DEGRADADOS[indice % DEGRADADOS.length],
}));
