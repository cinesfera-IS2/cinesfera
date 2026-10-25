import { HeartIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { StarRating } from "@/features/profile/components/star-rating";
import { fechaLarga } from "@/features/profile/lib/fechas";
import type { ResenaPerfil } from "@/features/profile/types";

type ReviewCardProps = {
  resena: ResenaPerfil;
};

export function ReviewCard({ resena }: ReviewCardProps) {
  return (
    <Link
      href={resena.href}
      aria-label={`Ver ${resena.titulo} y esta reseña`}
      className="group block rounded-2xl focus-visible:outline-offset-4"
    >
      <article className="flex gap-4 rounded-2xl border border-night-700 bg-night-900/60 p-4 transition-colors group-hover:border-frame/50 sm:gap-5 sm:p-5">
        <div
          className={`relative h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-night-600 bg-linear-to-b ${resena.posterGradient}`}
        >
          {resena.posterUrl && (
            <Image
              src={resena.posterUrl}
              alt={`Póster de ${resena.titulo}`}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-ink-100 transition-colors group-hover:text-glow-300">
              {resena.titulo}
              {resena.anio && (
                <span className="font-sans text-sm font-normal text-ink-500">
                  {" "}
                  ({resena.anio})
                </span>
              )}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {resena.puntaje !== null && (
                <StarRating puntaje={resena.puntaje} />
              )}
              <time dateTime={resena.fecha} className="text-xs text-ink-500">
                {fechaLarga(resena.fecha)}
              </time>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-ink-300 text-pretty">
            {resena.comentario}
          </p>

          {resena.meGusta !== undefined && (
            <p className="flex items-center gap-1.5 text-xs text-ink-500">
              <HeartIcon weight="fill" className="size-3.5 text-rose-400/80" />
              {resena.meGusta} me gusta
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
