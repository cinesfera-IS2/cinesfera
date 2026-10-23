import Image from "next/image";
import Link from "next/link";

import { PosterNoDisponible } from "@/features/catalog/components/poster-no-disponible";
import type { Obra } from "@/features/catalog/types";

type ObraCardProps = {
  obra: Obra;
  prioridad?: boolean;
};

export function ObraCard({ obra, prioridad = false }: ObraCardProps) {
  const anio = obra.fechaEstreno?.slice(0, 4);

  return (
    <article className="group">
      <Link
        href={`/content/${obra.tipo}/${obra.tmdbId}`}
        className="block rounded-lg focus-visible:outline-offset-4"
      >
        <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-night-850 shadow-lg shadow-black/40 ring-1 ring-white/5 transition-[box-shadow] duration-200 group-hover:ring-frame/70">
          {obra.poster ? (
            <Image
              src={obra.poster}
              alt={`Póster de ${obra.titulo}`}
              fill
              sizes="(min-width: 1280px) 200px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={prioridad}
              className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <PosterNoDisponible degradado={obra.posterGradient} />
          )}
        </div>

        <h3
          title={obra.titulo}
          className="mt-3 line-clamp-2 font-display text-[0.9375rem] leading-snug font-bold text-ink-100 transition-colors group-hover:text-glow-300"
        >
          {obra.titulo}
        </h3>
        <p className="mt-1 flex gap-1.5 text-sm text-ink-400">
          <span>{obra.tipo === "serie" ? "Serie" : "Película"}</span>
          {anio && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{anio}</span>
            </>
          )}
        </p>
      </Link>
    </article>
  );
}
