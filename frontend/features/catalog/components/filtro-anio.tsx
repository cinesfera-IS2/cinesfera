import { ANIO_MINIMO } from "@/features/catalog/types";

type FiltroAnioProps = {
  valor?: number;
};

/**
 * A diferencia del tipo, no aplica el filtro al cambiar: buscaría con cada
 * dígito que se tipea ("1", "19", "199"…), así que se espera a Enter o a la lupa.
 */
export function FiltroAnio({ valor }: Readonly<FiltroAnioProps>) {
  return (
    <label className="flex h-11 w-28 shrink-0 items-center gap-2 rounded-lg border border-night-600 bg-night-900 px-3.5 transition-colors focus-within:border-brand-400 hover:border-ink-500">
      <span aria-hidden className="text-sm font-semibold text-ink-400">
        Año
      </span>
      <input
        type="number"
        name="anio"
        aria-label="Año de estreno"
        defaultValue={valor}
        min={ANIO_MINIMO}
        max={new Date().getFullYear()}
        step={1}
        inputMode="numeric"
        placeholder="Todos"
        className="w-full min-w-0 bg-transparent text-sm text-ink-100 tabular-nums [appearance:textfield] placeholder:text-ink-400 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}
