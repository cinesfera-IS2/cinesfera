"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  ResenaContenido,
  TipoContenido,
} from "@/features/content/types";
import { apiFetch } from "@/lib/api";

export type EstadoResenas =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; resenas: ResenaContenido[] };

type ResenasContexto = {
  tipo: TipoContenido;
  tmdbId: number;
  estado: EstadoResenas;
  reintentar: () => void;
  actualizar: () => void;
};

const Contexto = createContext<ResenasContexto | null>(null);

type ResenasProviderProps = {
  tipo: TipoContenido;
  tmdbId: number;
  children: ReactNode;
};

/**
 * Pide las reseñas una sola vez para toda la ficha: el puntaje de la cabecera
 * y el listado leen el mismo estado, así que publicar una reseña actualiza los dos.
 */
export function ResenasProvider({ tipo, tmdbId, children }: ResenasProviderProps) {
  const [estado, setEstado] = useState<EstadoResenas>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  const reintentar = useCallback(() => {
    setEstado({ estado: "cargando" });
    setIntento((actual) => actual + 1);
  }, []);

  const actualizar = useCallback(() => {
    setIntento((actual) => actual + 1);
  }, []);

  useEffect(() => {
    const controlador = new AbortController();

    apiFetch<ResenaContenido[]>(`/contenidos/${tipo}/${tmdbId}/resenas`, {
      cache: "no-store",
      signal: controlador.signal,
    })
      .then((resenas) => {
        const ordenadas = [...resenas].sort((a, b) =>
          b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)
        );
        setEstado({ estado: "listo", resenas: ordenadas });
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
  }, [intento, tipo, tmdbId]);

  return (
    <Contexto value={{ tipo, tmdbId, estado, reintentar, actualizar }}>
      {children}
    </Contexto>
  );
}

/** `null` fuera de un `ResenasProvider`. */
export function useResenas(): ResenasContexto | null {
  return useContext(Contexto);
}
