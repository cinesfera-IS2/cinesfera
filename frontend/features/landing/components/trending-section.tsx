import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import { ListaNoDisponible, ObraCard, ObraCardEsqueleto, obrasEnTendencia } from "@/features/catalog";

/** Llenan filas completas con 2, 3 y 6 columnas. */
export const TENDENCIAS_EN_PORTADA = 12;

const GRILLA = "mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6";

export function TrendingSection() {
  return (
    <section id="tendencias" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Tendencias de la Semana
            </h2>
            <p className="mt-1.5 text-sm text-ink-400">
              Lo que más se está viendo esta semana. ¿Ya lo viste? Contá qué te pareció.
            </p>
          </div>

          <Link
            href="/tendencias"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-glow-400 transition-colors hover:text-glow-300"
          >
            Ver todas las tendencias
            <CaretRightIcon weight="bold" className="size-4" />
          </Link>
        </div>

        <Suspense fallback={<GrillaEsqueleto />}>
          <GrillaTendencias />
        </Suspense>
      </div>
    </section>
  );
}

export async function GrillaTendencias() {
  const lista = await obrasEnTendencia().catch(() => null);

  if (!lista) {
    return (
      <div className="mt-8">
        <ListaNoDisponible />
      </div>
    );
  }

  const conPoster = lista.obras.filter((obra) => obra.poster).slice(0, TENDENCIAS_EN_PORTADA);

  return (
    <ul className={GRILLA}>
      {conPoster.map((obra) => (
        <li key={`${obra.tipo}-${obra.tmdbId}`}>
          <ObraCard obra={obra} />
        </li>
      ))}
    </ul>
  );
}

const SILUETAS_GRILLA = Array.from({ length: TENDENCIAS_EN_PORTADA }, (_, indice) => `silueta-${indice}`);

export function GrillaEsqueleto() {
  return (
    <ul aria-busy="true" aria-label="Cargando tendencias" className={GRILLA}>
      {SILUETAS_GRILLA.map((clave) => (
        <li key={clave}>
          <ObraCardEsqueleto />
        </li>
      ))}
    </ul>
  );
}
