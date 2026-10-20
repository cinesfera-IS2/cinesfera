import type { Metadata } from "next";
import { Suspense } from "react";

import {
  BuscadorCatalogo,
  ResultadosCatalogo,
  ResultadosEsqueleto,
  hrefCatalogo,
  leerFiltros,
} from "@/features/catalog";
import { LandingFooter, LandingHeader } from "@/features/landing";

export const metadata: Metadata = {
  title: "Catálogo — Cinesfera",
  description:
    "Buscá películas y series por título, género o fecha de estreno y descubrí qué opina la comunidad de Cinesfera.",
};

export default async function CatalogoPage({
  searchParams,
}: PageProps<"/catalogo">) {
  const filtros = leerFiltros(await searchParams);

  return (
    <>
      <LandingHeader />

      <main className="flex-1">
        <div className="hero-halo">
          <div className="mx-auto max-w-7xl px-6 pt-10 pb-6 sm:pt-12">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Catálogo
            </h1>
            <p className="mt-2 text-sm text-ink-400 sm:text-base">
              Buscá tu próxima película o serie y mirá qué opina la comunidad.
            </p>
          </div>
        </div>

        {/* La barra de búsqueda queda pegada debajo de la cabecera mientras se
            recorre la grilla, así cambiar un filtro no obliga a volver arriba. */}
        <div className="sticky top-[var(--alto-cabecera)] z-40 border-y border-white/5 bg-night-950/85 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-3">
            <BuscadorCatalogo filtros={filtros} />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pt-8 pb-16">
          {/* La key hace que cada búsqueda nueva muestre el esqueleto
              mientras llegan los resultados. */}
          <Suspense key={hrefCatalogo(filtros)} fallback={<ResultadosEsqueleto />}>
            <ResultadosCatalogo filtros={filtros} />
          </Suspense>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}
