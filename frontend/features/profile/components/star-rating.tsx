import { StarHalfIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";

type StarRatingProps = {
  /** De 0 a 5, en pasos de media estrella. */
  puntaje: number;
};

export function StarRating({ puntaje }: StarRatingProps) {
  return (
    <span
      role="img"
      aria-label={`${puntaje} de 5 estrellas`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((posicion) => {
        if (puntaje >= posicion) {
          return (
            <StarIcon
              key={posicion}
              weight="fill"
              className="size-4 text-glow-400"
            />
          );
        }

        if (puntaje >= posicion - 0.5) {
          return (
            <StarHalfIcon
              key={posicion}
              weight="fill"
              className="size-4 text-glow-400"
            />
          );
        }

        return (
          <StarIcon key={posicion} className="size-4 text-night-600" />
        );
      })}
    </span>
  );
}
