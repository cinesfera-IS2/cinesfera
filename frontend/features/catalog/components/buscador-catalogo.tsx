import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import Form from "next/form";
import Link from "next/link";

import { FiltroAnio } from "@/features/catalog/components/filtro-anio";
import { FiltroSelect } from "@/features/catalog/components/filtro-select";
import { hrefCatalogo } from "@/features/catalog/lib/filtros";
import {
  GENEROS,
  ORDENES,
  TIPOS,
  type FiltrosCatalogo,
} from "@/features/catalog/types";

type BuscadorCatalogoProps = {
  filtros: FiltrosCatalogo;
};

const OPCIONES_TIPO = [
  { valor: "", etiqueta: "Películas y series" },
  ...TIPOS.map(({ valor, etiqueta }) => ({ valor, etiqueta })),
];

const OPCIONES_ORDEN = ORDENES.map(({ valor, etiqueta }) => ({
  valor,
  etiqueta,
}));

export function BuscadorCatalogo({ filtros }: BuscadorCatalogoProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* La key remonta el formulario al cambiar los filtros por fuera (chips,
          "Limpiar filtros"), para que los campos no muestren valores viejos. */}
      <Form
        key={hrefCatalogo(filtros, { pagina: 1 })}
        action="/catalogo"
        scroll={false}
        role="search"
        className="flex flex-col gap-3"
      >
        {filtros.genero && (
          <input type="hidden" name="genero" value={filtros.genero} />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Buscar películas y series por título</span>
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-ink-500"
            />
            <input
              type="search"
              name="q"
              defaultValue={filtros.texto}
              placeholder="Buscá películas o series por título…"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-night-600 bg-night-900 pr-3.5 pl-11 text-sm text-ink-100 placeholder:text-ink-500 transition-colors focus:border-brand-400 focus:outline-none"
            />
          </label>

          <button
            type="submit"
            className="h-11 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-400"
          >
            Buscar
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="flex gap-3">
            <FiltroSelect
              nombre="tipo"
              etiqueta="Tipo"
              valor={filtros.tipo ?? ""}
              opciones={OPCIONES_TIPO}
            />
            <FiltroSelect
              nombre="orden"
              etiqueta="Ordenar por"
              valor={filtros.orden}
              opciones={OPCIONES_ORDEN}
            />
          </div>

          <FiltroAnio
            nombre="anio"
            etiqueta="Año de estreno"
            valor={filtros.anioEstreno}
          />
        </div>
      </Form>

      <nav aria-label="Géneros" className="-mx-6 px-6">
        <ul className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          <li>
            <ChipGenero
              href={hrefCatalogo(filtros, { genero: undefined, pagina: 1 })}
              activo={!filtros.genero}
            >
              Todos
            </ChipGenero>
          </li>
          {GENEROS.map((genero) => (
            <li key={genero.slug}>
              <ChipGenero
                href={hrefCatalogo(filtros, { genero: genero.slug, pagina: 1 })}
                activo={filtros.genero === genero.slug}
              >
                {genero.nombre}
              </ChipGenero>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

type ChipGeneroProps = {
  href: string;
  activo: boolean;
  children: React.ReactNode;
};

function ChipGenero({ href, activo, children }: ChipGeneroProps) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "page" : undefined}
      className={
        activo
          ? "block rounded-full border border-glow-400/60 bg-glow-400/10 px-4 py-1.5 text-sm font-semibold whitespace-nowrap text-glow-300"
          : "block rounded-full border border-night-600 px-4 py-1.5 text-sm whitespace-nowrap text-ink-400 transition-colors hover:border-ink-500 hover:text-ink-100"
      }
    >
      {children}
    </Link>
  );
}
