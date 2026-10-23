"use client";

import {
  ArrowClockwiseIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react";
import { useEffect } from "react";

import type { UsuarioSesion } from "@/features/auth/session";
import { ContentReviewThread } from "@/features/content/components/content-review-thread";
import { useResenas } from "@/features/content/components/resenas-provider";
import { agruparResenas } from "@/features/content/lib/agrupar-resenas";


type ContentReviewsProps = {
  usuario: UsuarioSesion | null;
};


export function ContentReviews({ usuario }: Readonly<ContentReviewsProps>) {
  const resenas = useResenas();

  if (!resenas) {
    throw new Error("ContentReviews tiene que estar dentro de un ResenasProvider.");
  }

  const { estado, tipo, tmdbId, reintentar, actualizar } = resenas;
  const hilos = estado.estado === "listo" ? agruparResenas(estado.resenas) : [];

  useEffect(() => {
    if (estado.estado !== "listo") return;

    const objetivo = window.location.hash.slice(1);
    if (!objetivo.startsWith("resena-")) return;

    document.getElementById(objetivo)?.scrollIntoView({ block: "center" });
  }, [estado]);

  return (
    <section aria-labelledby="titulo-resenas">
      <h2
        id="titulo-resenas"
        className="mb-5 flex items-baseline gap-2.5 font-display text-2xl font-bold"
      >
        Reseñas
        {hilos.length > 0 && (
          <span className="text-base font-semibold text-ink-400 tabular-nums">
            {hilos.length}
          </span>
        )}
      </h2>

      {estado.estado === "cargando" && <ReviewsSkeleton />}

      {estado.estado === "error" && (
        <div
          role="alert"
          className="flex flex-col items-center rounded-2xl border border-rose-400/20 bg-rose-400/5 px-6 py-10 text-center"
        >
          <p className="font-display font-bold text-ink-100">
            No pudimos cargar las reseñas
          </p>
          <p className="mt-2 max-w-md text-sm text-ink-400">{estado.mensaje}</p>
          <button
            type="button"
            onClick={reintentar}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.97]"
          >
            <ArrowClockwiseIcon weight="bold" className="size-4" />
            Volver a intentar
          </button>
        </div>
      )}

      {estado.estado === "listo" && hilos.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-400">
            <ChatCircleTextIcon className="size-6" />
          </span>
          <h3 className="mt-3 font-display font-bold text-ink-100">
            Todavía no existen reseñas
          </h3>
          <p className="mt-2 max-w-sm text-sm text-ink-400">
            Sé la primera persona en compartir qué te pareció este contenido.
          </p>
        </div>
      )}

      {hilos.length > 0 && (
        <div className="flex flex-col gap-5">
          {hilos.map((hilo) => (
            <ContentReviewThread
              key={hilo.resena.id}
              hilo={hilo}
              tipo={tipo}
              tmdbId={tmdbId}
              usuarioId={usuario?.id}
              onPublicada={actualizar}
            />
          ))}
        </div>
      )}
    </section>
  );
}


function ReviewsSkeleton() {
  return (
    <div aria-label="Cargando reseñas" aria-busy="true" className="flex flex-col gap-5">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="flex gap-3 rounded-2xl border border-white/5 bg-night-900/50 p-5 sm:p-6"
        >
          <span className="size-10 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="flex flex-1 flex-col gap-2.5 pt-1">
            <span className="h-3.5 w-36 animate-pulse rounded bg-white/10" />
            <span className="h-3 w-24 animate-pulse rounded bg-white/5" />
            <span className="mt-2 h-3 w-full animate-pulse rounded bg-white/5" />
            <span className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
