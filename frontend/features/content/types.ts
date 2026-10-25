export type TipoContenido = "pelicula" | "serie";

export type GeneroContenido = {
  id: number;
  nombre: string;
};

export type ContenidoDetalle = {
  tmdb_id: number;
  tipo: TipoContenido;
  titulo: string;
  titulo_original: string;
  sinopsis: string;
  fecha_estreno: string | null;
  poster_url: string | null;
  portada_url: string | null;
  generos: GeneroContenido[];
  duracion_minutos: number | null;
  cantidad_temporadas: number | null;
  calificacion_tmdb: number;
};

export type AutorResena = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  foto_url: string | null;
};

export type ResenaContenido = {
  id: string;
  contenido_tmdb_id: number;
  resena_padre_id: string | null;
  plataforma_id: number | null;
  calificacion: number | null;
  texto: string;
  fecha: string;
  valoracion: number;
  promedio_comunitario: number | null;
  cantidad_valoraciones: number;
  autor: AutorResena;
};

export type CalificacionPropia = {
  resena_id: string;
  calificacion: number;
};

export type CalificacionActualizada = CalificacionPropia & {
  promedio_comunitario: number;
  cantidad_valoraciones: number;
};
