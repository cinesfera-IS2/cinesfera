/** Perfil público de una persona dentro de Cinesfera. */
export type PerfilPublico = {
  id: string;
  /** Sin arroba: es el valor exacto que va en la URL del perfil. */
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  /**
   * Dato privado: el endpoint público no lo devuelve, así que solo va a estar
   * cuando la sesión lo traiga para el perfil propio.
   */
  email?: string;
  fotoUrl?: string;
  rol: "usuario" | "admin";
  /** ISO `YYYY-MM-DD`. */
  fechaRegistro: string;
  bio?: string;
  ubicacion?: string;
  generosFavoritos: string[];
  estadisticas: EstadisticasPerfil;
};

export type EstadisticasPerfil = {
  resenas: number;
  vistas: number;
  seguidores: number;
  siguiendo: number;
};

export type ResenaPerfil = {
  id: string;
  titulo: string;
  /** Falta mientras el catálogo no resuelva el id de TMDB. */
  anio?: number;
  /** De 0 a 5, en pasos de media estrella. */
  puntaje: number;
  /** ISO `YYYY-MM-DD`. */
  fecha: string;
  comentario: string;
  /** Degradado de respaldo mientras no haya póster real. */
  posterGradient: string;
  /** El backend todavía no expone los votos de cada reseña por separado. */
  meGusta?: number;
};

export type SeccionPerfil = "resenas";
