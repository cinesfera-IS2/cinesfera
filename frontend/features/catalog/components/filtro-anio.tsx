import { ANIO_MINIMO } from "@/features/catalog/types";

type FiltroAnioProps = {
  nombre: string;
  etiqueta: string;
  valor?: number;
};

/**
 * A diferencia de los selects, no aplica el filtro al cambiar: buscaría con
 * cada dígito que se tipea ("1", "19", "199"…), así que se espera al botón
 * Buscar o a Enter.
 */
export function FiltroAnio({ nombre, etiqueta, valor }: FiltroAnioProps) {
  return (
    <label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-night-600 bg-night-900 px-3.5 transition-colors focus-within:border-brand-400 hover:border-ink-500 sm:flex-none">
      <span className="text-sm whitespace-nowrap text-ink-500">{etiqueta}</span>
      <input
        type="number"
        name={nombre}
        defaultValue={valor}
        min={ANIO_MINIMO}
        max={new Date().getFullYear()}
        step={1}
        inputMode="numeric"
        placeholder="Todos"
        className="w-full min-w-0 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none sm:w-20"
      />
    </label>
  );
}
