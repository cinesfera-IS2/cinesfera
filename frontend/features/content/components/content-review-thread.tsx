
"use client";

import { ContentReviewCard } from "@/features/content/components/content-review-card";
import { CreateContentReview } from "@/features/content/components/create-content-review";
import { EditContentRating } from "@/features/content/components/edit-content-rating";
import type { HiloResena } from "@/features/content/lib/agrupar-resenas";
import type { CalificacionActualizada, CalificacionPropia, TipoContenido } from "@/features/content/types";

type ContentReviewThreadProps = {
  hilo: HiloResena;
  tipo: TipoContenido;
  tmdbId: number;
  usuarioId?: string;
  onPublicada: () => void;
  profundidad?: number;
  calificacionesPropias: CalificacionPropia[];
  onValoracionActualizada: (valoracion: CalificacionActualizada) => void;
};

export function ContentReviewThread({
  hilo,
  tipo,
  tmdbId,
  usuarioId,
  onPublicada,
  profundidad = 0,
  calificacionesPropias,
  onValoracionActualizada,
}: ContentReviewThreadProps) {
  const esPadre = hilo.resena.resena_padre_id === null;
  const propia = usuarioId && esPadre
    ? calificacionesPropias.find((valoracion) => valoracion.resena_id === hilo.resena.id)
    : undefined;

  return (
    <div>
      <ContentReviewCard resena={hilo.resena} />

      {esPadre && (
        <p className="mt-2 text-sm text-ink-400" aria-live="polite">
          Promedio de la comunidad: {hilo.resena.promedio_comunitario != null && hilo.resena.cantidad_valoraciones > 0
            ? `${hilo.resena.promedio_comunitario.toLocaleString("es", { maximumFractionDigits: 2 })} / 5 · ${hilo.resena.cantidad_valoraciones} ${hilo.resena.cantidad_valoraciones === 1 ? "valoración" : "valoraciones"}`
            : "Sin valoraciones"}
        </p>
      )}

      {usuarioId && (
        <div className="mt-2 flex flex-wrap gap-2">
          <CreateContentReview
            tipo={tipo}
            tmdbId={tmdbId}
            usuarioId={usuarioId}
            resenaPadreId={hilo.resena.id}
            permiteCalificacion={esPadre && hilo.resena.autor.id !== usuarioId && !propia}
            onPublicada={onPublicada}
          />
          {propia && (
            <EditContentRating
              tipo={tipo}
              tmdbId={tmdbId}
              resenaId={hilo.resena.id}
              calificacion={propia.calificacion}
              onActualizada={onValoracionActualizada}
            />
          )}
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
              calificacionesPropias={calificacionesPropias}
              onValoracionActualizada={onValoracionActualizada}
            />
          ))}
        </div>
      )}
    </div>
  );
}
