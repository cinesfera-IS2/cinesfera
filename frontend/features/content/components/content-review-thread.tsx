"use client";

import { ContentReviewCard } from "@/features/content/components/content-review-card";
import { CreateContentReview } from "@/features/content/components/create-content-review";
import type { HiloResena } from "@/features/content/lib/agrupar-resenas";
import type { TipoContenido } from "@/features/content/types";
import type { UsuarioSesion } from "@/features/auth/session";
import { ReportButton } from "@/features/reports/report-button";

type ContentReviewThreadProps = {
  hilo: HiloResena;
  tipo: TipoContenido;
  tmdbId: number;
  usuario?: UsuarioSesion | null;
  onPublicada: () => void;
  profundidad?: number;
};

export function ContentReviewThread({
  hilo,
  tipo,
  tmdbId,
  usuario,
  onPublicada,
  profundidad = 0,
}: ContentReviewThreadProps) {
  return (
    <div>
      <ContentReviewCard
        resena={hilo.resena}
        esRespuesta={profundidad > 0}
        acciones={
          usuario && usuario.rol !== "admin" && (
            <>
              <CreateContentReview
                tipo={tipo}
                tmdbId={tmdbId}
                usuarioId={usuario.id}
                resenaPadreId={hilo.resena.id}
                subtitulo={`Respondiendo a ${hilo.resena.autor.nombre} ${hilo.resena.autor.apellido}`}
                onPublicada={onPublicada}
              />
              {usuario.id !== hilo.resena.autor.id && (
                <ReportButton tipo="comentario" objetivoId={hilo.resena.id} />
              )}
            </>
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
              usuario={usuario}
              onPublicada={onPublicada}
              profundidad={profundidad + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
