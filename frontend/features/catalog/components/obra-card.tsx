import Image from "next/image";
import Link from "next/link";

import type { Obra } from "@/features/catalog/types";

type ObraCardProps = {
  obra: Obra;
  prioridad?: boolean;
};

export function ObraCard({ obra, prioridad = false }: ObraCardProps) {
  const anio = obra.fechaEstreno?.slice(0, 4);

  return (
    <article className="group">
      <Link href={`/content/${obra.tipo}/${obra.tmdbId}`} className="block">
        <div className="relative aspect-2/3 overflow-hidden rounded-lg border border-white/5 bg-night-850 shadow-lg shadow-black/40 transition-colors group-hover:border-frame/70">
          {obra.poster ? (
            <Image
              src={obra.poster}
              alt={`Póster de ${obra.titulo}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
              priority={prioridad}
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden
              className={`absolute inset-0 bg-linear-to-b ${obra.posterGradient}`}
            />
          )}

          {obra.tipo === "serie" && (
            <span className="absolute top-2.5 left-2.5 rounded-md bg-night-950/80 px-2 py-1 text-xs font-semibold tracking-wide text-ink-100 uppercase backdrop-blur-sm">
              Serie
            </span>
          )}
        </div>

        <h3
          title={obra.titulo}
          className="mt-3 truncate font-display text-base font-bold text-ink-100 transition-colors group-hover:text-glow-300"
        >
          {obra.titulo}
        </h3>
        {anio && <p className="mt-0.5 text-sm text-ink-400">{anio}</p>}
      </Link>
    </article>
  );
}
