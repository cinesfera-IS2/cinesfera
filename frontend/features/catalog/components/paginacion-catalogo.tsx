import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { hrefCatalogo, paginasVisibles } from "@/features/catalog/lib/filtros";
import type { FiltrosCatalogo } from "@/features/catalog/types";

type PaginacionCatalogoProps = {
  filtros: FiltrosCatalogo;
  pagina: number;
  totalPaginas: number;
};

const BASE =
  "grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-semibold transition-colors";

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

        {paginasVisibles(pagina, totalPaginas).map((numero, indice) =>
          numero === "…" ? (
            <li key={`salto-${indice}`} aria-hidden className="px-1 text-ink-500">
              …
            </li>
          ) : (
            <li key={numero}>
              <Link
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
              </Link>
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
    <Link
      href={href}
      aria-label={etiqueta}
      className={`${BASE} border border-night-600 text-ink-300 hover:border-ink-500 hover:text-ink-100`}
    >
      {children}
    </Link>
  );
}
