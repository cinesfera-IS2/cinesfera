import { StarHalfIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";

/** Celeste para el puntaje de la película y naranja para la valoración de las reseñas */
export type TonoEstrellas = "celeste" | "naranja";

const RELLENO: Record<TonoEstrellas, string> = {
  celeste: "text-glow-400",
  naranja: "text-comunidad-400",
};

type StarRatingProps = {
  /** De 0 a 5, en pasos de media estrella. */
  puntaje: number;
  tono?: TonoEstrellas;
};

export function StarRating({ puntaje, tono = "celeste" }: StarRatingProps) {
  const relleno = RELLENO[tono];
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
              className={`size-4 ${relleno}`}
            />
          );
        }

        if (puntaje >= posicion - 0.5) {
          return (
            <StarHalfIcon
              key={posicion}
              weight="fill"
              className={`size-4 ${relleno}`}
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
