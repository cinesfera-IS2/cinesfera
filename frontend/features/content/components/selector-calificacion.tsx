"use client";

import { StarIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

type SelectorCalificacionProps = {
  name: string;
  etiqueta?: string;
  valorInicial?: number | null;
};

const PALABRAS: Record<number, string> = {
  0.5: "Pésima",
  1: "Muy mala",
  1.5: "Mala",
  2: "Floja",
  2.5: "Regular",
  3: "Buena",
  3.5: "Muy buena",
  4: "Excelente",
  4.5: "Imperdible",
  5: "Obra maestra",
};

function nombreDelValor(valor: number): string {
  return `${valor} ${valor === 1 ? "estrella" : "estrellas"}`;
}

/**
 * Cinco estrellas que se marcan por mitades. Por debajo son diez radios
 * nativos con el mismo `name`: así el valor viaja en el `FormData`, las
 * flechas del teclado cambian la nota y el `reset()` del formulario la limpia.
 */
export function SelectorCalificacion({
  name,
  etiqueta = "Calificación",
  valorInicial = null,
}: SelectorCalificacionProps) {
  const grupo = useRef<HTMLFieldSetElement>(null);
  const [valor, setValor] = useState<number | null>(valorInicial);
  const [previa, setPrevia] = useState<number | null>(null);

  useEffect(() => {
    const formulario = grupo.current?.form;
    if (!formulario) return;

    const reiniciar = () => {
      setValor(valorInicial);
      setPrevia(null);
    };
    formulario.addEventListener("reset", reiniciar);
    return () => formulario.removeEventListener("reset", reiniciar);
  }, [valorInicial]);

  const mostrado = previa ?? valor;
  const enVistaPrevia = previa !== null && previa !== valor;

  return (
    <fieldset ref={grupo}>
      <legend className="mb-2 text-sm font-semibold text-ink-300">{etiqueta}</legend>

      {/* Todo en este panel tiene tamaño fijo: marcar o pasar por encima de las
          estrellas solo cambia colores y textos, nunca medidas. */}
      <div className="flex flex-col gap-3 rounded-xl border border-night-600 bg-night-900 px-3 py-3 has-[:focus-visible]:border-glow-400 sm:flex-row sm:items-center sm:justify-between sm:pr-5">
        <div className="flex" onMouseLeave={() => setPrevia(null)}>
          {[1, 2, 3, 4, 5].map((posicion) => {
            const relleno =
              mostrado === null
                ? 0
                : Math.min(Math.max(mostrado - (posicion - 1), 0), 1);

            return (
              <span key={posicion} className="relative grid size-12 place-items-center">
                <span aria-hidden className="relative size-10">
                  <StarIcon weight="fill" className="absolute inset-0 size-full text-night-600" />
                  <StarIcon
                    weight="fill"
                    style={{ clipPath: `inset(0 ${100 - relleno * 100}% 0 0)` }}
                    className={`absolute inset-0 size-full transition-[clip-path,opacity] duration-150 ease-out text-glow-400 ${
                      enVistaPrevia ? "opacity-55" : "opacity-100"
                    }`}
                  />
                </span>

                {[posicion - 0.5, posicion].map((opcion) => (
                  <label
                    key={opcion}
                    onMouseEnter={() => setPrevia(opcion)}
                    className={`absolute inset-y-0 w-1/2 cursor-pointer ${
                      opcion === posicion ? "right-0" : "left-0"
                    }`}
                  >
                    <input
                      type="radio"
                      name={name}
                      value={opcion}
                      defaultChecked={opcion === valorInicial}
                      onChange={() => {
                        setValor(opcion);
                        // En pantallas táctiles nunca llega el mouseleave que borraría la vista previa.
                        setPrevia(null);
                      }}
                      className="sr-only"
                    />
                    <span className="sr-only">{nombreDelValor(opcion)}</span>
                  </label>
                ))}
              </span>
            );
          })}
        </div>

        <div aria-hidden className="flex h-9 items-baseline gap-2 px-2 sm:h-16 sm:w-36 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5 sm:px-0">
          <p
            className={`font-display text-3xl leading-none font-extrabold tabular-nums transition-colors duration-150 ${
              mostrado === null
                ? "text-night-600"
                : enVistaPrevia
                  ? "text-ink-400"
                  : "text-ink-100"
            }`}
          >
            {(mostrado ?? 0).toFixed(1)}
          </p>
          <p className="truncate text-sm text-ink-400">
            {mostrado === null ? "Sin calificar" : PALABRAS[mostrado]}
          </p>
        </div>
      </div>
    </fieldset>
  );
}
