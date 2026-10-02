"use client";

import {
  ArrowClockwiseIcon,
  ChatCircleTextIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { ContentReviewCard } from "@/features/content/components/content-review-card";
import type {
  ResenaContenido,
  TipoContenido,
} from "@/features/content/types";
import { apiFetch } from "@/lib/api";


type ContentReviewsProps = {
  tipo: TipoContenido;
  tmdbId: number;
};


type EstadoResenas =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; resenas: ResenaContenido[] };


export function ContentReviews({ tipo, tmdbId }: ContentReviewsProps) {
  const [estado, setEstado] = useState<EstadoResenas>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  const reintentar = useCallback(() => {
    setEstado({ estado: "cargando" });
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
    <section aria-labelledby="titulo-resenas">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-glow-300 uppercase">
            Comunidad
          </p>
          <h2 id="titulo-resenas" className="mt-1 font-display text-2xl font-bold">
            Reseñas
          </h2>
        </div>
        {estado.estado === "listo" && estado.resenas.length > 0 && (
          <span className="rounded-full bg-night-800 px-3 py-1 text-xs text-ink-400">
            {estado.resenas.length}
          </span>
        )}
      </div>

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
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600"
          >
            <ArrowClockwiseIcon weight="bold" className="size-4" />
            Volver a intentar
          </button>
        </div>
      )}

      {estado.estado === "listo" && estado.resenas.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-500">
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

      {estado.estado === "listo" && estado.resenas.length > 0 && (
        <div className="flex flex-col gap-4">
          {estado.resenas.map((resena) => (
            <ContentReviewCard key={resena.id} resena={resena} />
          ))}
        </div>
      )}
    </section>
  );
}


function ReviewsSkeleton() {
  return (
    <div aria-label="Cargando reseñas" aria-busy="true" className="space-y-4">
      {[1, 2].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-2xl border border-night-700 bg-night-900/60"
        />
      ))}
    </div>
  );
}
