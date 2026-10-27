"use client";

import { ContentReviewCard } from "@/features/content/components/content-review-card";
import { CreateContentReview } from "@/features/content/components/create-content-review";
import { EditContentRating } from "@/features/content/components/edit-content-rating";
import type { UsuarioSesion } from "@/features/auth/session";
import type { HiloResena } from "@/features/content/lib/agrupar-resenas";
import type { CalificacionActualizada, CalificacionPropia, TipoContenido } from "@/features/content/types";
import { ReportButton } from "@/features/reports/report-button";

type ContentReviewThreadProps = {
  hilo: HiloResena;
  tipo: TipoContenido;
  tmdbId: number;
  usuario?: UsuarioSesion | null;
  onPublicada: () => void;
  profundidad?: number;
  calificacionesPropias: CalificacionPropia[];
  onValoracionActualizada: (valoracion: CalificacionActualizada) => void;
};

export function ContentReviewThread({
  hilo,
  tipo,
  tmdbId,
  usuario,
  onPublicada,
  profundidad = 0,
  calificacionesPropias,
  onValoracionActualizada,
}: ContentReviewThreadProps) {
  const usuarioId = usuario?.id;
  const esPadre = hilo.resena.resena_padre_id === null;
  const propia = usuarioId && esPadre
    ? calificacionesPropias.find((valoracion) => valoracion.resena_id === hilo.resena.id)
    : undefined;

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
                permiteCalificacion={esPadre && hilo.resena.autor.id !== usuario.id && !propia}
                subtitulo={`Respondiendo a ${hilo.resena.autor.nombre} ${hilo.resena.autor.apellido}`}
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
              calificacionesPropias={calificacionesPropias}
              onValoracionActualizada={onValoracionActualizada}
            />
          ))}
        </div>
      )}
    </div>
  );
}
