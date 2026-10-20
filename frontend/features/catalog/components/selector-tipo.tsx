"use client";

import { TIPOS, type TipoObra } from "@/features/catalog/types";

const OPCIONES: { valor: TipoObra | ""; etiqueta: string }[] = [
  { valor: "", etiqueta: "Todo" },
  ...TIPOS,
];

type SelectorTipoProps = {
  valor?: TipoObra;
};

/**
 * Las tres opciones a la vista en lugar de un select: se ve qué está elegido
 * y se cambia con un clic. Aplica el filtro apenas cambia, como antes el select.
 */
export function SelectorTipo({ valor }: SelectorTipoProps) {
  return (
    <fieldset className="flex h-11 min-w-0 flex-1 rounded-lg border border-night-600 bg-night-900 p-1 has-[:focus-visible]:border-glow-400 md:flex-none">
      <legend className="sr-only">Tipo</legend>
      {OPCIONES.map((opcion) => (
        <label
          key={opcion.valor || "todo"}
          className="flex flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-sm font-semibold whitespace-nowrap text-ink-400 transition-colors duration-150 hover:text-ink-100 has-[:checked]:bg-night-700 has-[:checked]:text-ink-100 sm:px-3.5"
        >
          <input
            type="radio"
            name="tipo"
            value={opcion.valor}
            defaultChecked={(valor ?? "") === opcion.valor}
            onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
            className="sr-only"
          />
          {opcion.etiqueta}
        </label>
      ))}
    </fieldset>
  );
}
