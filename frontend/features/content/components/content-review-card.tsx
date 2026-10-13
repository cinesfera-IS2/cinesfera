import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import type { ResenaContenido } from "@/features/content/types";
import { StarRating } from "@/features/profile/components/star-rating";
import { fechaLarga } from "@/features/profile/lib/fechas";


type ContentReviewCardProps = {
  resena: ResenaContenido;
};


export function ContentReviewCard({ resena }: ContentReviewCardProps) {
  const nombreCompleto = `${resena.autor.nombre} ${resena.autor.apellido}`;

  return (
    <article className="rounded-2xl border border-night-700 bg-night-900/60 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-500/20 font-display text-sm font-bold text-glow-300">
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
          <div className="min-w-0">
            <Link
              href={`/profile/${encodeURIComponent(resena.autor.nombre_usuario)}`}
              className="block truncate font-display font-bold text-ink-100 hover:text-glow-300"
            >
              {nombreCompleto}
            </Link>
            <p className="truncate text-xs text-ink-500">
              @{resena.autor.nombre_usuario}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StarRating puntaje={resena.calificacion} />
          <time dateTime={resena.fecha} className="text-xs text-ink-500">
            {fechaLarga(resena.fecha)}
          </time>
        </div>
      </div>

      <p className="mt-4 leading-relaxed text-ink-300 text-pretty">
        {resena.texto}
      </p>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-500">
        <HeartIcon
          weight={resena.valoracion > 0 ? "fill" : "regular"}
          className="size-4 text-rose-400/80"
        />
        {resena.valoracion} {resena.valoracion === 1 ? "valoración" : "valoraciones"}
      </p>
    </article>
  );
}
