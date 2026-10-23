import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";

import { EnlaceCatalogo } from "@/features/catalog/components/navegacion-catalogo";
import { hrefCatalogo, paginasVisibles } from "@/features/catalog/lib/filtros";
import type { FiltrosCatalogo } from "@/features/catalog/types";

type PaginacionCatalogoProps = {
  filtros: FiltrosCatalogo;
  pagina: number;
  totalPaginas: number;
};

const BASE =
  "grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-semibold tabular-nums transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.96]";

export function PaginacionCatalogo({
  filtros,
  pagina,
  totalPaginas,
}: PaginacionCatalogoProps) {
  if (totalPaginas <= 1) {
    return null;
  }

  return (
    <nav aria-label="Paginación" className="mt-12 flex justify-center">
      <ul className="flex items-center gap-1.5">
        <li>
          <FlechaPagina
            href={pagina > 1 ? hrefCatalogo(filtros, { pagina: pagina - 1 }) : undefined}
            etiqueta="Página anterior"
          >
            <CaretLeftIcon weight="bold" className="size-4" />
          </FlechaPagina>
        </li>

        {/* En móvil no entran todos los números: se resume la posición. */}
        <li aria-hidden className="px-3 text-sm font-semibold text-ink-300 tabular-nums sm:hidden">
          {pagina} / {totalPaginas}
        </li>

        {conClaves(paginasVisibles(pagina, totalPaginas)).map(({ numero, clave }) =>
          numero === "…" ? (
            <li key={clave} aria-hidden className="hidden px-1 text-ink-400 sm:block">
              …
            </li>
          ) : (
            <li key={clave} className="hidden sm:block">
              <EnlaceCatalogo
                href={hrefCatalogo(filtros, { pagina: numero })}
                aria-label={`Página ${numero}`}
                aria-current={numero === pagina ? "page" : undefined}
                className={
                  numero === pagina
                    ? `${BASE} bg-brand-500 text-white`
                    : `${BASE} text-ink-400 hover:bg-night-800 hover:text-ink-100`
                }
              >
                {numero}
              </EnlaceCatalogo>
            </li>
          )
        )}

        <li>
          <FlechaPagina
            href={
              pagina < totalPaginas
                ? hrefCatalogo(filtros, { pagina: pagina + 1 })
                : undefined
            }
            etiqueta="Página siguiente"
          >
            <CaretRightIcon weight="bold" className="size-4" />
          </FlechaPagina>
        </li>
      </ul>
    </nav>
  );
}

/**
 * Puede haber dos "…" en la lista; cada uno se identifica por la página que lo
 * precede, que siempre es un número (la primera nunca se saltea).
 */
function conClaves(paginas: (number | "…")[]) {
  return paginas.map((numero, posicion) => ({
    numero,
    clave: numero === "…" ? `salto-despues-de-${paginas[posicion - 1]}` : `pagina-${numero}`,
  }));
}

type FlechaPaginaProps = {
  /** Sin href es porque no hay página hacia ese lado. */
  href?: string;
  etiqueta: string;
  children: React.ReactNode;
};

function FlechaPagina({ href, etiqueta, children }: FlechaPaginaProps) {
  if (!href) {
    return (
      <span
        aria-hidden
        className={`${BASE} border border-night-700 text-night-600`}
      >
        {children}
      </span>
    );
  }

  return (
    <EnlaceCatalogo
      href={href}
      aria-label={etiqueta}
      className={`${BASE} border border-night-600 text-ink-300 hover:border-ink-500 hover:text-ink-100`}
    >
      {children}
    </EnlaceCatalogo>
  );
}
