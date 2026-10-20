import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import type {
  PerfilPublico,
  ResenaPerfil,
  UsuarioSeguimiento,
} from "@/features/profile/types";

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
  bio: string | null;
  ubicacion: string | null;
  generos_favoritos: string[];
  rol: "usuario" | "admin";
  fecha_registro: string;
  /** Suma de los votos recibidos por todas sus reseñas. */
  reputacion: number;
  seguidores: number;
  siguiendo: number;
  resenas: ResenaApi[];
};

type ResenaApi = {
  id: string;
  contenido_tmdb_id: number;
  plataforma_id: number | null;
  /** De 0.5 a 5, en pasos de media estrella; `null` si quedó guardada sin nota. */
  calificacion: number | null;
  texto: string;
  /** ISO con hora y zona. */
  fecha: string;
};

type UsuarioSeguimientoApi = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  foto_url: string | null;
};

export type ListaSeguimientos = "seguidores" | "seguidos" | "amigos";

/**
 * Trae una lista social. Seguidores y seguidos son públicos; amigos requiere
 * que la sesión corresponda al perfil solicitado.
 */
export async function obtenerListaSeguimientos(
  usuarioId: string,
  lista: ListaSeguimientos,
  options: RequestInit = {}
): Promise<UsuarioSeguimiento[]> {
  const usuarios = await apiFetch<UsuarioSeguimientoApi[]>(
    `/usuarios/${usuarioId}/${lista}`,
    { ...options, cache: "no-store" }
  );

  return usuarios.map((usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreUsuario: usuario.nombre_usuario,
    fotoUrl: usuario.foto_url ?? undefined,
  }));
}

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
        `/usuarios/por-nombre/${encodeURIComponent(nombreUsuario)}/perfil-publico`,
        { cache: "no-store" }
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }

      throw error;
    }

    return {
      perfil: aPerfil(respuesta),
      resenas: respuesta.resenas.map((resena, indice) =>
        aResena(resena, indice)
      ),
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
    rol: api.rol,
    fechaRegistro: api.fecha_registro.slice(0, 10),
    bio: api.bio ?? undefined,
    ubicacion: api.ubicacion ?? undefined,
    generosFavoritos: api.generos_favoritos,
    estadisticas: {
      resenas: api.resenas.length,
      seguidores: api.seguidores,
      siguiendo: api.siguiendo,
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
