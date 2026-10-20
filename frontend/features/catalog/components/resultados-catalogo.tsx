import { FilmSlateIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { PaginacionCatalogo } from "@/features/catalog/components/paginacion-catalogo";
import { ObraCard } from "@/features/catalog/components/obra-card";
import { buscarObras } from "@/features/catalog/data/catalogo";
import { hayFiltrosActivos } from "@/features/catalog/lib/filtros";
import type { FiltrosCatalogo } from "@/features/catalog/types";

type ResultadosCatalogoProps = {
  filtros: FiltrosCatalogo;
};

export const GRILLA_OBRAS =
  "grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:grid-cols-5";

export async function ResultadosCatalogo({ filtros }: ResultadosCatalogoProps) {
  const { obras, pagina, totalPaginas } = await buscarObras(filtros);
  const filtrado = hayFiltrosActivos(filtros);

  console.log(obras)

  if (obras.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-500">
          <FilmSlateIcon className="size-6" />
        </span>
        <h2 className="font-display text-base font-bold text-ink-100">
          No encontramos resultados
        </h2>
        <p className="max-w-sm text-sm text-ink-400 text-pretty">
          Probá con otro título o sacá algún filtro para ver más resultados.
        </p>
        <LimpiarFiltros />
      </div>
    );
  }

  return (
    <section aria-label="Resultados">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-400">
          Página <span className="font-semibold text-ink-100">{pagina}</span>{" "}
          de <span className="font-semibold text-ink-100">{totalPaginas}</span>
        </p>
        {filtrado && <LimpiarFiltros />}
      </div>

      <ul className={GRILLA_OBRAS}>
        {obras.map((obra, indice) => (
          <li key={`${obra.tipo}-${obra.tmdbId}`}>
            <ObraCard obra={obra} prioridad={indice < 5} />
          </li>
        ))}
      </ul>

      <PaginacionCatalogo
        filtros={filtros}
        pagina={pagina}
        totalPaginas={totalPaginas}
      />
    </section>
  );
}

function LimpiarFiltros() {
  return (
    <Link
      href="/catalogo"
      scroll={false}
      className="text-sm font-medium text-glow-400 transition-colors hover:text-glow-300"
    >
      Limpiar filtros
    </Link>
  );
}
