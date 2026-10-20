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
      <ContentReviewCard
        resena={hilo.resena}
        esRespuesta={profundidad > 0}
        acciones={
          usuarioId && (
            <CreateContentReview
              tipo={tipo}
              tmdbId={tmdbId}
              usuarioId={usuarioId}
              resenaPadreId={hilo.resena.id}
              subtitulo={`Respondiendo a ${hilo.resena.autor.nombre} ${hilo.resena.autor.apellido}`}
              onPublicada={onPublicada}
            />
          )
        }
      />

      {hilo.respuestas.length > 0 && (
        <div
          className={`mt-3 flex flex-col gap-3 border-l border-night-600 pl-4 sm:pl-5 ${
            profundidad < 2 ? "ml-5 sm:ml-7" : ""
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
