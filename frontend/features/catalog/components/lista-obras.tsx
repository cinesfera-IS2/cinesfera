import { FilmSlateIcon } from "@phosphor-icons/react/dist/ssr";

import { ObraCard } from "@/features/catalog/components/obra-card";
import { Paginacion } from "@/features/catalog/components/paginacion-catalogo";
import { GRILLA_OBRAS } from "@/features/catalog/components/resultados-catalogo";
import type { PaginaCatalogo } from "@/features/catalog/types";

type ListaObrasProps = {
  pagina: PaginaCatalogo;
  /** Ruta de la lista; la página 1 es la ruta sola y las demás llevan `?pagina=`. */
  ruta: string;
};

/** Grilla paginada de una lista armada por TMDB, como Joyas o Tendencias. */
export function ListaObras({ pagina, ruta }: Readonly<ListaObrasProps>) {
  if (pagina.obras.length === 0) {
    return <ListaNoDisponible mensaje="No hay obras en esta página de la lista." />;
  }

  return (
    <>
      {/* Ocupa el mismo alto que la barra del esqueleto, así nada salta al cargar. */}
      <p className="mb-6 flex h-8 items-center text-sm text-ink-400 tabular-nums">
        Página <span className="mx-1 font-semibold text-ink-100">{pagina.pagina}</span> de{" "}
        <span className="ml-1 font-semibold text-ink-100">{pagina.totalPaginas}</span>
      </p>

      <ul className={GRILLA_OBRAS}>
        {pagina.obras.map((obra, indice) => (
          <li key={`${obra.tipo}-${obra.tmdbId}`}>
            <ObraCard obra={obra} prioridad={indice < 6} />
          </li>
        ))}
      </ul>

      <Paginacion
        pagina={pagina.pagina}
        totalPaginas={pagina.totalPaginas}
        hrefPagina={(numero) => (numero === 1 ? ruta : `${ruta}?pagina=${numero}`)}
      />
    </>
  );
}

/** Lo que se ve si TMDB no responde: la página sigue en pie y se explica qué pasó. */
export function ListaNoDisponible({
  mensaje = "No pudimos cargar esta lista ahora. Probá de nuevo en un rato.",
}: Readonly<{ mensaje?: string }>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-400">
        <FilmSlateIcon className="size-6" />
      </span>
      <p className="max-w-sm text-sm text-pretty text-ink-400">{mensaje}</p>
    </div>
  );
}
