import { ArrowRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Form from "next/form";

import { FiltroAnio } from "@/features/catalog/components/filtro-anio";
import { SelectorTipo } from "@/features/catalog/components/selector-tipo";
import { hrefCatalogo } from "@/features/catalog/lib/filtros";
import type { FiltrosCatalogo } from "@/features/catalog/types";

type BuscadorCatalogoProps = {
  filtros: FiltrosCatalogo;
};

export function BuscadorCatalogo({ filtros }: BuscadorCatalogoProps) {
  return (
    // La key remonta el formulario al cambiar los filtros por fuera (las
    // etiquetas de filtros activos), para que los campos no muestren valores viejos.
    <Form
      key={hrefCatalogo(filtros, { pagina: 1 })}
      action="/catalogo"
      scroll={false}
      role="search"
      className="flex flex-col gap-2.5 md:flex-row md:items-center"
    >
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Buscar películas y series por título</span>
        <MagnifyingGlassIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-400"
        />
        <input
          type="search"
          name="q"
          defaultValue={filtros.texto}
          placeholder="Buscá por título"
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-night-600 bg-night-900 pr-12 pl-11 text-sm text-ink-100 transition-colors placeholder:text-ink-400 hover:border-ink-500 focus:border-brand-400 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Buscar"
          className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-md bg-brand-500 text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.94]"
        >
          <ArrowRightIcon weight="bold" className="size-4" />
        </button>
      </label>

      <div className="flex gap-2.5">
        <SelectorTipo valor={filtros.tipo} />
        <FiltroAnio valor={filtros.anioEstreno} />
      </div>
    </Form>
  );
}
