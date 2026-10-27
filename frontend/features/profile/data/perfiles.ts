import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api";
import { obtenerContenido } from "@/features/content/data/contenido";
import type {
  ContenidoDetalle,
  TipoContenido,
} from "@/features/content/types";
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
  contenido_tipo: TipoContenido;
  contenido_titulo: string | null;
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
    const respuesta = await pedirPerfilPublico(nombreUsuario);

    if (!respuesta) {
      return null;
    }

    const contenidos = await obtenerContenidosDeResenas(respuesta.resenas);

    return {
      perfil: aPerfil(respuesta),
      resenas: respuesta.resenas.map((resena, indice) =>
        aResena(
          resena,
          indice,
          contenidos.get(claveContenido(resena)) ?? null
        )
      ),
    };
  }
);

/**
 * Solo los datos del perfil, sin las fichas de sus reseñas: para mostrarlo en
 * un listado no hace falta salir a TMDB.
 */
export async function buscarPerfil(nombreUsuario: string): Promise<PerfilPublico | null> {
  const respuesta = await pedirPerfilPublico(nombreUsuario);
  return respuesta ? aPerfil(respuesta) : null;
}

async function pedirPerfilPublico(nombreUsuario: string): Promise<PerfilPublicoApi | null> {
  try {
    return await apiFetch<PerfilPublicoApi>(
      `/usuarios/por-nombre/${encodeURIComponent(nombreUsuario)}/perfil-publico`,
      { cache: "no-store" }
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

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

async function obtenerContenidosDeResenas(
  resenas: ResenaApi[]
): Promise<Map<string, ContenidoDetalle>> {
  const unicos = new Map<string, ResenaApi>();
  for (const resena of resenas) {
    unicos.set(claveContenido(resena), resena);
  }

  const resultados = await Promise.all(
    [...unicos.entries()].map(async ([clave, resena]) => {
      try {
        const contenido = await obtenerContenido(
          resena.contenido_tipo,
          resena.contenido_tmdb_id
        );
        return contenido ? ([clave, contenido] as const) : null;
      } catch {
        // El perfil sigue siendo útil si TMDB atraviesa una incidencia.
        return null;
      }
    })
  );

  return new Map(
    resultados.filter(
      (resultado): resultado is readonly [string, ContenidoDetalle] =>
        resultado !== null
    )
  );
}

function claveContenido(resena: ResenaApi): string {
  return `${resena.contenido_tipo}:${resena.contenido_tmdb_id}`;
}

function aResena(
  api: ResenaApi,
  indice: number,
  contenido: ContenidoDetalle | null
): ResenaPerfil {
  const anio = contenido?.fecha_estreno
    ? Number(contenido.fecha_estreno.slice(0, 4))
    : undefined;

  return {
    id: api.id,
    titulo:
      contenido?.titulo ??
      api.contenido_titulo ??
      `${api.contenido_tipo === "serie" ? "Serie" : "Película"} #${api.contenido_tmdb_id}`,
    anio: Number.isFinite(anio) ? anio : undefined,
    puntaje: api.calificacion,
    fecha: api.fecha.slice(0, 10),
    comentario: api.texto,
    posterUrl: contenido?.poster_url ?? undefined,
    posterGradient: DEGRADADOS[indice % DEGRADADOS.length],
    href: `/content/${api.contenido_tipo}/${api.contenido_tmdb_id}#resena-${api.id}`,
  };
}
