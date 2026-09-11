import { PosterFrame } from "@/features/landing/components/poster-frame";

type TitleCardFrameProps = {
  title: string;
  poster?: string;
  posterGradient: string;
  sizes: string;
  /** Fila de metadatos que va bajo el título (puntuación, género, año…). */
  children: React.ReactNode;
};

/**
 * Contenedor común de las fichas del rediseño: borde azul claro, arte cuadrado
 * arriba y una banda inferior más oscura con el título y sus metadatos.
 */
export function TitleCardFrame({
  title,
  poster,
  posterGradient,
  sizes,
  children,
}: TitleCardFrameProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-frame/60 bg-night-850 transition-colors hover:border-frame">
      <div className="relative aspect-square">
        <PosterFrame
          title={title}
          poster={poster}
          posterGradient={posterGradient}
          sizes={sizes}
        />
      </div>

      <div className="border-t border-white/5 bg-night-950 px-4 py-3.5">
        <h3 className="font-display text-sm font-bold text-ink-100">{title}</h3>
        <div className="mt-2.5 flex items-center justify-between gap-3">
          {children}
        </div>
      </div>
    </article>
  );
}
