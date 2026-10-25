"use client";

import { CreateContentReview } from "@/features/content/components/create-content-review";
import { useResenas } from "@/features/content/components/resenas-provider";

type EscribirResenaProps = {
  usuarioId: string;
  tituloContenido: string;
};

/** Conecta el botón de nueva reseña con el listado que tiene que refrescar. */
export function EscribirResena({ usuarioId, tituloContenido }: Readonly<EscribirResenaProps>) {
  const resenas = useResenas();

  if (!resenas) return null;

  return (
    <CreateContentReview
      tipo={resenas.tipo}
      tmdbId={resenas.tmdbId}
      usuarioId={usuarioId}
      subtitulo={tituloContenido}
      onPublicada={resenas.actualizar}
    />
  );
}
