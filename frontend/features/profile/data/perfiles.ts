import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import type { PerfilPublico, ResenaPerfil } from "@/features/profile/types";

/**
 * Respuesta de `GET /usuarios/por-nombre/{nombre_usuario}/perfil-publico`.
 * Es el espejo de `PerfilPublicoRespuesta` en el backend: si cambia allá, esto
 * tiene que cambiar acá.
 */
type PerfilPublicoApi = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  foto_url: string | null;
  /** Suma de los votos recibidos por todas sus reseñas. */
  reputacion: number;
  resenas: ResenaApi[];
};

type ResenaApi = {
  id: string;
  contenido_tmdb_id: number;
  plataforma_id: number | null;
  /** De 0.5 a 5, en pasos de media estrella. */
  calificacion: number;
  texto: string;
  /** ISO con hora y zona. */
  fecha: string;
};

/**
 * Lo que el perfil muestra y la base todavía no guarda. Son los mismos valores
 * para todas las personas a propósito: sirven para ver la pantalla completa
 * mientras los campos no existen, y se van a ir cayendo de a uno.
 *
 * `rol` y `fechaRegistro` sí están en la tabla `usuarios`, pero el endpoint
 * público no los devuelve; alcanzaría con sumarlos a `PerfilPublicoRespuesta`
 * para que dejen de ser de ejemplo.
 */
const EJEMPLO = {
  bio: "Cazador de thrillers lentos y bandas sonoras que no puedo sacarme de la cabeza. Si la película dura más de tres horas, mejor.",
  ubicacion: "Montevideo, Uruguay",
  generosFavoritos: ["Thriller", "Sci-Fi", "Drama"],
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  vistas: 184,
  seguidores: 212,
  siguiendo: 97,
} as const;

/** Degradados de respaldo del póster, repartidos entre las reseñas por orden. */
const DEGRADADOS = [
  "from-sky-500/30 via-night-850 to-night-950",
  "from-violet-600/35 via-night-850 to-night-950",
  "from-cyan-500/25 via-night-850 to-night-950",
  "from-teal-500/30 via-night-850 to-night-950",
  "from-rose-500/30 via-night-850 to-night-950",
];

/**
 * Trae el perfil y sus reseñas en una sola llamada, que es como las entrega el
 * backend. Va envuelto en `cache` porque la página y `generateMetadata` lo
 * piden por separado y así se resuelve con un solo pedido por request.
 *
 * Devuelve `null` cuando el nombre de usuario no existe, para que la ruta
 * pueda responder con su propio `not-found`.
 */
export const obtenerPerfilPublico = cache(
  async (
    nombreUsuario: string
  ): Promise<{ perfil: PerfilPublico; resenas: ResenaPerfil[] } | null> => {
    let respuesta: PerfilPublicoApi;

    try {
      respuesta = await apiFetch<PerfilPublicoApi>(
        `/usuarios/por-nombre/${encodeURIComponent(nombreUsuario)}/perfil-publico`
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }

    return {
      perfil: aPerfil(respuesta),
      resenas: respuesta.resenas.map(aResena),
    };
  }
);

function aPerfil(api: PerfilPublicoApi): PerfilPublico {
  return {
    id: api.id,
    nombreUsuario: api.nombre_usuario,
    nombre: api.nombre,
    apellido: api.apellido,
    fotoUrl: api.foto_url ?? undefined,
    rol: EJEMPLO.rol,
    fechaRegistro: EJEMPLO.fechaRegistro,
    bio: EJEMPLO.bio,
    ubicacion: EJEMPLO.ubicacion,
    generosFavoritos: [...EJEMPLO.generosFavoritos],
    estadisticas: {
      resenas: api.resenas.length,
      vistas: EJEMPLO.vistas,
      seguidores: EJEMPLO.seguidores,
      siguiendo: EJEMPLO.siguiendo,
    },
  };
}

function aResena(api: ResenaApi, indice: number): ResenaPerfil {
  return {
    id: api.id,
    // La tabla `resenas` guarda solo el id de TMDB del contenido: el título, el
    // año y el póster llegan cuando esté enchufado el servicio de catálogo.
    titulo: `Película #${api.contenido_tmdb_id}`,
    puntaje: api.calificacion,
    fecha: api.fecha.slice(0, 10),
    comentario: api.texto,
    posterGradient: DEGRADADOS[indice % DEGRADADOS.length],
  };
}
