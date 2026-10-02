"use client";

import { CaretDownIcon } from "@phosphor-icons/react";

type FiltroSelectProps = {
  nombre: string;
  etiqueta: string;
  valor: string;
  opciones: { valor: string; etiqueta: string }[];
};

/** Select que aplica el filtro apenas cambia, sin esperar al botón Buscar. */
export function FiltroSelect({
  nombre,
  etiqueta,
  valor,
  opciones,
}: FiltroSelectProps) {
  return (
    <label className="relative flex-1 sm:flex-none">
      <span className="sr-only">{etiqueta}</span>
      <select
        name={nombre}
        defaultValue={valor}
        onChange={(evento) => evento.currentTarget.form?.requestSubmit()}
        className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-night-600 bg-night-900 pr-9 pl-3.5 text-sm text-ink-100 transition-colors hover:border-ink-500 focus:border-brand-400 focus:outline-none sm:w-48"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      <CaretDownIcon
        aria-hidden
        weight="bold"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-400"
      />
    </label>
  );
}
