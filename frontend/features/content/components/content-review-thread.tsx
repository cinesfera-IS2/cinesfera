
"use client";

import { ContentReviewCard } from "@/features/content/components/content-review-card";
import { CreateContentReview } from "@/features/content/components/create-content-review";
import type { HiloResena } from "@/features/content/lib/agrupar-resenas";
import type { TipoContenido } from "@/features/content/types";

type ContentReviewThreadProps = {
  hilo: HiloResena;
  tipo: TipoContenido;
  tmdbId: number;
  usuarioId?: string;
  onPublicada: () => void;
  profundidad?: number;
};

export function ContentReviewThread({
  hilo,
  tipo,
  tmdbId,
  usuarioId,
  onPublicada,
  profundidad = 0,
}: ContentReviewThreadProps) {
  return (
    <div>
      <ContentReviewCard resena={hilo.resena} />

      {usuarioId && (
        <div className="mt-2">
          <CreateContentReview
            tipo={tipo}
            tmdbId={tmdbId}
            usuarioId={usuarioId}
            resenaPadreId={hilo.resena.id}
            permiteCalificacion={hilo.resena.resena_padre_id === null && hilo.resena.autor.id !== usuarioId}
            onPublicada={onPublicada}
          />
        </div>
      )}

      {hilo.respuestas.length > 0 && (
        <div
          className={`mt-4 flex flex-col gap-4 border-l-2 border-night-600 pl-4 ${
            profundidad < 2 ? "sm:ml-6" : ""
          }`}
        >
          {hilo.respuestas.map((respuesta) => (
            <ContentReviewThread
              key={respuesta.resena.id}
              hilo={respuesta}
              tipo={tipo}
              tmdbId={tmdbId}
              usuarioId={usuarioId}
              onPublicada={onPublicada}
              profundidad={profundidad + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
