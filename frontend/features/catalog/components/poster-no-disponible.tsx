import { FilmSlateIcon } from "@phosphor-icons/react/dist/ssr";

type PosterNoDisponibleProps = {
  /** Clases `from-/via-/to-` del degradado de fondo. */
  degradado?: string;
};

/** Ocupa el marco del póster cuando TMDB no tiene imagen para la obra. */
export function PosterNoDisponible({
  degradado = "from-night-700 via-night-800 to-night-900",
}: PosterNoDisponibleProps) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-linear-to-b px-4 text-center ${degradado}`}
    >
      <FilmSlateIcon
        aria-hidden
        weight="duotone"
        className="size-10 text-ink-400/80"
      />
      <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
        Portada no disponible
      </p>
    </div>
  );
}
