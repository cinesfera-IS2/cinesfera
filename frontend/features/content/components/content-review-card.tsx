import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

import type { ResenaContenido } from "@/features/content/types";
import { StarRating } from "@/features/profile/components/star-rating";
import { fechaLarga } from "@/features/profile/lib/fechas";


type ContentReviewCardProps = {
  resena: ResenaContenido;
  /** Las respuestas cuelgan del hilo sin tarjeta propia. */
  esRespuesta?: boolean;
  acciones?: ReactNode;
};


export function ContentReviewCard({
  resena,
  esRespuesta = false,
  acciones,
}: Readonly<ContentReviewCardProps>) {
  const nombreCompleto = `${resena.autor.nombre} ${resena.autor.apellido}`;
  const esPadre = resena.resena_padre_id === null;

  return (
    <article
      id={`resena-${resena.id}`}
      className={`flex scroll-mt-24 gap-3 target:rounded-2xl target:ring-2 target:ring-glow-400/30 ${
        esRespuesta
          ? "py-1"
          : "rounded-2xl border border-white/5 bg-night-900/50 p-5 target:border-glow-400/60 sm:gap-4 sm:p-6"
      }`}
    >
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-500/20 font-display font-bold text-glow-300 ${
          esRespuesta ? "size-8 text-xs" : "size-10 text-sm"
        }`}
      >
        {resena.autor.foto_url ? (
          // La foto puede venir de cualquier proveedor configurado por la persona.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resena.autor.foto_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          `${resena.autor.nombre[0] ?? ""}${resena.autor.apellido[0] ?? ""}`
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-[18px] gap-y-2.5">
          <div className="min-w-0">
            <Link
              href={`/profile/${encodeURIComponent(resena.autor.nombre_usuario)}`}
              className="block truncate font-display font-bold text-ink-100 transition-colors hover:text-glow-300"
            >
              {nombreCompleto}
            </Link>
            <p className="truncate text-xs text-ink-400">
              @{resena.autor.nombre_usuario}
              <span aria-hidden> · </span>
              <time dateTime={resena.fecha}>{fechaLarga(resena.fecha)}</time>
            </p>
          </div>

          {esPadre && (
            <div
              className="flex shrink-0 items-center gap-2 max-sm:w-full"
              aria-live="polite"
            >
              <span className="text-[0.72rem] text-comunidad-200">
                Valoración de la comunidad
              </span>
              {resena.promedio_comunitario != null &&
              resena.cantidad_valoraciones > 0 ? (
                <>
                  <StarRating
                    puntaje={resena.promedio_comunitario}
                    tono="naranja"
                  />
                  <span className="font-display text-[0.82rem] font-extrabold text-comunidad-300 tabular-nums">
                    <span>
                      {resena.promedio_comunitario.toLocaleString("es", {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    /5
                  </span>
                </>
              ) : (
                <span className="text-[0.76rem] font-semibold text-comunidad-100">
                  Sin valoraciones
                </span>
              )}
            </div>
          )}
        </div>

        <p className="mt-[14px] leading-relaxed whitespace-pre-line text-pretty text-ink-300">
          {resena.texto}
        </p>

        {esPadre && resena.calificacion !== null && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[0.78rem] text-ink-400">Película</span>
            <StarRating puntaje={resena.calificacion} />
            <span className="font-display text-[0.82rem] font-extrabold text-glow-300 tabular-nums">
              {resena.calificacion.toLocaleString("es", {
                maximumFractionDigits: 2,
              })}
              /5
            </span>
          </div>
        )}

        {(resena.valoracion > 0 || acciones) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-ink-400">
            {resena.valoracion > 0 && (
              <p className="flex items-center gap-1.5">
                <HeartIcon weight="fill" className="size-4 text-rose-400/80" />
                {resena.valoracion}{" "}
                {resena.valoracion === 1 ? "valoración" : "valoraciones"}
              </p>
            )}
            {acciones}
          </div>
        )}
      </div>
    </article>
  );
}
