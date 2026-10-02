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
          <div className="mx-auto max-w-7xl px-6 pt-12 pb-8">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Catálogo
            </h1>
            <p className="mt-2 text-sm text-ink-400 sm:text-base">
              Buscá tu próxima película o serie y mirá qué opina la comunidad.
            </p>

            <div className="mt-8">
              <BuscadorCatalogo filtros={filtros} />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-16">
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
