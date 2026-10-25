"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CalificacionActualizada,
  CalificacionPropia,
  ResenaContenido,
  TipoContenido,
} from "@/features/content/types";
import { apiFetch } from "@/lib/api";

export type EstadoResenas =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; resenas: ResenaContenido[]; propias: CalificacionPropia[] };

type ResenasContexto = {
  tipo: TipoContenido;
  tmdbId: number;
  estado: EstadoResenas;
  reintentar: () => void;
  actualizar: () => void;
  actualizarValoracion: (valoracion: CalificacionActualizada) => void;
};

const Contexto = createContext<ResenasContexto | null>(null);

type ResenasProviderProps = {
  tipo: TipoContenido;
  tmdbId: number;
  children: ReactNode;
  usuarioId?: string;
};

/**
 * Pide las reseñas una sola vez para toda la ficha: el puntaje de la cabecera
 * y el listado leen el mismo estado, así que publicar una reseña actualiza los dos.
 */
export function ResenasProvider({ tipo, tmdbId, children, usuarioId }: Readonly<ResenasProviderProps>) {
  const [estado, setEstado] = useState<EstadoResenas>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  const actualizarValoracion = useCallback((valoracion: CalificacionActualizada) => {
    setEstado((actual) => {
      if (actual.estado !== "listo") return actual;
      return {
        ...actual,
        resenas: actual.resenas.map((resena) => resena.id === valoracion.resena_id ? {
          ...resena,
          promedio_comunitario: valoracion.promedio_comunitario,
          cantidad_valoraciones: valoracion.cantidad_valoraciones,
        } : resena),
        propias: actual.propias.map((propia) => propia.resena_id === valoracion.resena_id ? {
          resena_id: valoracion.resena_id, calificacion: valoracion.calificacion,
        } : propia),
      };
    });
  }, []);

  const reintentar = useCallback(() => {
    setEstado({ estado: "cargando" });
    setIntento((actual) => actual + 1);
  }, []);

  const actualizar = useCallback(() => {
    setIntento((actual) => actual + 1);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    Promise.all([
      apiFetch<ResenaContenido[]>(`/contenidos/${tipo}/${tmdbId}/resenas`, {
        cache: "no-store",
        signal: controlador.signal,
      }),
      usuarioId ? apiFetch<CalificacionPropia[]>(`/contenidos/${tipo}/${tmdbId}/valoraciones/mias`, {
        cache: "no-store",
        signal: controlador.signal,
      }) : Promise.resolve([]),
    ])
      .then(([resenas, propias]) => {
        if (controlador.signal.aborted) return;
        const ordenadas = [...resenas].sort((a, b) =>
          b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)
        );
        setEstado({ estado: "listo", resenas: ordenadas, propias });
      })
      .catch((error: unknown) => {
        if (controlador.signal.aborted) return;
        setEstado({
          estado: "error",
          mensaje:
            error instanceof Error
              ? error.message
              : "No fue posible obtener las reseñas.",
        });
      });

    return () => controlador.abort();
  }, [intento, tipo, tmdbId, usuarioId]);

  const valor = useMemo(
    () => ({ tipo, tmdbId, estado, reintentar, actualizar, actualizarValoracion }),
    [tipo, tmdbId, estado, reintentar, actualizar, actualizarValoracion]
  );

  return (
    <Contexto value={valor}>
      {children}
    </Contexto>
  );
}

/** `null` fuera de un `ResenasProvider`. */
export function useResenas(): ResenasContexto | null {
  return useContext(Contexto);
}
