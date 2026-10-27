import { ApiError } from "@/lib/api";
import { FilmSlateIcon, XIcon } from "@phosphor-icons/react/dist/ssr";

import { EnlaceCatalogo } from "@/features/catalog/components/navegacion-catalogo";
import { PaginacionCatalogo } from "@/features/catalog/components/paginacion-catalogo";
import { ObraCard } from "@/features/catalog/components/obra-card";
import { buscarObras } from "@/features/catalog/data/catalogo";
import { filtrosActivos, tituloResultados } from "@/features/catalog/lib/filtros";
import type { FiltrosCatalogo } from "@/features/catalog/types";

type ResultadosCatalogoProps = {
  filtros: FiltrosCatalogo;
};

export const GRILLA_OBRAS =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export async function ResultadosCatalogo({ filtros }: ResultadosCatalogoProps) {
  let resultado;
  try {
    resultado = await buscarObras(filtros);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status < 500) throw error;
    return (
      <section role="alert" className="rounded-2xl border border-night-600 p-8 text-center">
        <h2 className="font-display text-lg font-bold">No pudimos cargar el catálogo</h2>
        <p className="mt-3 text-ink-400">El servicio no responde en este momento. Probá nuevamente.</p>
        <a href="/catalogo" className="mt-4 inline-block text-glow-400">Reintentar</a>
      </section>
    );
  }
  const { obras, pagina, totalPaginas } = resultado;

  return (
    <section aria-labelledby="titulo-resultados">
      <EncabezadoResultados filtros={filtros} />

      {obras.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-400">
            <FilmSlateIcon className="size-6" />
          </span>
          <h3 className="font-display text-base font-bold text-ink-100">
            No encontramos resultados
          </h3>
          <p className="max-w-sm text-sm text-pretty text-ink-400">
            Probá con otro título o sacá algún filtro para ver más resultados.
          </p>
          <LimpiarFiltros />
        </div>
      ) : (
        <>
          <ul className={GRILLA_OBRAS}>
            {obras.map((obra, indice) => (
              <li key={`${obra.tipo}-${obra.tmdbId}`}>
                <ObraCard obra={obra} prioridad={indice < 6} />
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col items-center gap-4">
            <PaginacionCatalogo
              filtros={filtros}
              pagina={pagina}
              totalPaginas={totalPaginas}
            />
            <p className="hidden text-sm text-ink-400 tabular-nums sm:block">
              Página <span className="font-semibold text-ink-100">{pagina}</span>{" "}
              de <span className="font-semibold text-ink-100">{totalPaginas}</span>
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function EncabezadoResultados({ filtros }: Readonly<ResultadosCatalogoProps>) {
  const activos = filtrosActivos(filtros);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3">
      <h2
        id="titulo-resultados"
        className="min-w-0 font-display text-2xl font-extrabold tracking-tight text-balance text-ink-100"
      >
        {tituloResultados(filtros)}
      </h2>

      {activos.length > 0 && (
        <ul aria-label="Filtros activos" className="flex flex-wrap items-center gap-2">
          {activos.map((filtro) => (
            <li key={filtro.clave}>
              <EnlaceCatalogo
                href={filtro.hrefSinFiltro}
                scroll={false}
                aria-label={`Quitar filtro ${filtro.etiqueta}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-night-800 pr-2.5 pl-3 text-sm text-ink-300 transition-[color,border-color,transform] duration-150 ease-out hover:border-white/25 hover:text-ink-100 active:scale-[0.97]"
              >
                {filtro.etiqueta}
                <XIcon weight="bold" className="size-3.5 text-ink-400" />
              </EnlaceCatalogo>
            </li>
          ))}
          {activos.length > 1 && (
            <li>
              <LimpiarFiltros />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function LimpiarFiltros() {
  return (
    <EnlaceCatalogo
      href="/catalogo"
      scroll={false}
      className="rounded-full px-2 py-1.5 text-sm font-semibold text-glow-400 transition-colors hover:text-glow-300"
    >
      Limpiar filtros
    </EnlaceCatalogo>
  );
}
