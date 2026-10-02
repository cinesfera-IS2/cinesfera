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
  plataforma_id: number | null;
  calificacion: number;
  texto: string;
  fecha: string;
  valoracion: number;
  autor: AutorResena;
};
