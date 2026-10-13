import { cache } from "react";

import type {
  ContenidoDetalle,
  TipoContenido,
} from "@/features/content/types";
import { ApiError, apiFetch } from "@/lib/api";


export const obtenerContenido = cache(
  async (
    tipo: TipoContenido,
    tmdbId: number
  ): Promise<ContenidoDetalle | null> => {
    try {
      return await apiFetch<ContenidoDetalle>(`/contenidos/${tipo}/${tmdbId}`, {
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }
);
