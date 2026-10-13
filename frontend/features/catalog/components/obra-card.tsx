import { StarIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

import { anioDeEstreno } from "@/features/catalog/lib/buscar";
import { GENEROS, type Obra } from "@/features/catalog/types";

type ObraCardProps = {
  obra: Obra;
  prioridad?: boolean;
};

function nombreDeGenero(slug: Obra["generos"][number]): string {
  return GENEROS.find((genero) => genero.slug === slug)?.nombre ?? slug;
}

export function ObraCard({ obra, prioridad = false }: ObraCardProps) {
  const [generoPrincipal] = obra.generos;

  return (
    <article className="group">
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

        <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md bg-night-950/80 px-2 py-1 text-sm font-bold text-glow-400 backdrop-blur-sm">
          <StarIcon weight="fill" className="size-3.5" />
          {obra.calificacion.toFixed(1)}
        </span>
      </div>

      <h3
        title={obra.titulo}
        className="mt-3 truncate font-display text-base font-bold text-ink-100"
      >
        {obra.titulo}
      </h3>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-400">
        {generoPrincipal && <span>{nombreDeGenero(generoPrincipal)}</span>}
        <span aria-hidden>·</span>
        <span>{anioDeEstreno(obra)}</span>
      </p>
    </article>
  );
}
