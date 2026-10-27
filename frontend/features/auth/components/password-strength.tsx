import { CheckIcon, CircleIcon } from "@phosphor-icons/react/dist/ssr";

import type { EvaluacionPassword } from "@/features/auth/lib/password";

type PasswordStrengthProps = {
  evaluacion: EvaluacionPassword;
};

/** Un color por nivel: el índice 0 no se usa porque con 0 no se pinta nada. */
const COLORES = [
  "",
  "bg-rose-500",
  "bg-amber-400",
  "bg-lime-400",
  "bg-emerald-400",
];

const TEXTOS = [
  "",
  "text-rose-400",
  "text-amber-300",
  "text-lime-300",
  "text-emerald-300",
];

/** El largo mínimo ya lo dice la ayuda del campo; acá se ven solo las sugerencias. */
export function PasswordStrength({ evaluacion }: PasswordStrengthProps) {
  const { criterios, nivel, etiqueta } = evaluacion;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div aria-hidden className="flex flex-1 gap-1">
          {criterios.map((criterio, indice) => (
            <span
              key={criterio.etiqueta}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                indice < nivel ? COLORES[nivel] : "bg-night-700"
              }`}
            />
          ))}
        </div>
        <p
          aria-live="polite"
          className={`min-w-20 text-right text-xs font-semibold ${TEXTOS[nivel]}`}
        >
          {etiqueta}
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {criterios
          .filter((criterio) => !criterio.obligatorio)
          .map(({ etiqueta: texto, cumple }) => (
            <li
              key={texto}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                cumple ? "text-ink-300" : "text-ink-500"
              }`}
            >
              {cumple ? (
                <CheckIcon
                  weight="bold"
                  className="size-3.5 shrink-0 text-emerald-400"
                />
              ) : (
                <CircleIcon className="size-3.5 shrink-0" />
              )}
              {texto}
            </li>
          ))}
      </ul>
    </div>
  );
}
