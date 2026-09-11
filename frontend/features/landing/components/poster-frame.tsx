import Image from "next/image";

type PosterFrameProps = {
  title: string;
  poster?: string;
  posterGradient: string;
  sizes: string;
  priority?: boolean;
};

/**
 * Arte del título. Mientras no exista el póster real en /public se pinta el
 * degradado de respaldo, igual que los placeholders del rediseño.
 */
export function PosterFrame({
  title,
  poster,
  posterGradient,
  sizes,
  priority = false,
}: PosterFrameProps) {
  if (!poster) {
    return (
      <div
        aria-hidden
        className={`absolute inset-0 bg-linear-to-b ${posterGradient}`}
      />
    );
  }

  return (
    <Image
      src={poster}
      alt={`Póster de ${title}`}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
    />
  );
}
