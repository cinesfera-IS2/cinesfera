import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense } from "react";

import { ListaNoDisponible, ObraCardEsqueleto, obrasDestacadas } from "@/features/catalog";
import { FeaturedCarousel } from "@/features/landing/components/featured-carousel";
import { SectionEyebrow } from "@/features/landing/components/section-eyebrow";

/** Cuántas joyas entran en el carrusel de la portada. */
export const JOYAS_EN_PORTADA = 10;

export function FeaturedSection() {
  return (
    <section id="explorar" className="px-6 pb-20 pt-6 lg:pt-0">
      <div className="mx-auto max-w-7xl">
        <SectionEyebrow>Joyas de la cartelera</SectionEyebrow>

        <div className="mt-12">
          <Suspense fallback={<CarruselEsqueleto />}>
            <CarruselJoyas />
          </Suspense>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/joyas"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-glow-400 transition-colors hover:text-glow-300"
          >
            Ver todas las joyas
            <CaretRightIcon weight="bold" className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export async function CarruselJoyas() {
  const lista = await obrasDestacadas().catch(() => null);

  if (!lista) return <ListaNoDisponible />;

  // En la vidriera solo van las que tienen póster: una ficha vacía no invita a nadie.
  const conPoster = lista.obras.filter((obra) => obra.poster).slice(0, JOYAS_EN_PORTADA);

  return <FeaturedCarousel items={conPoster} />;
}

const SILUETAS_CARRUSEL = [
  { clave: "izquierda-lejos", escala: 0.78 },
  { clave: "izquierda", escala: 0.89 },
  { clave: "centro", escala: 1 },
  { clave: "derecha", escala: 0.89 },
  { clave: "derecha-lejos", escala: 0.78 },
];

/** Imita al carrusel: la ficha del centro grande y las de los costados más chicas. */
export function CarruselEsqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando joyas de la cartelera" className="flex justify-center gap-3 overflow-hidden pb-4">
      {SILUETAS_CARRUSEL.map(({ clave, escala }) => (
        <div
          key={clave}
          className="w-44 shrink-0 sm:w-52"
          style={{ transform: `scale(${escala})`, opacity: escala === 1 ? 1 : 0.55 }}
        >
          <ObraCardEsqueleto />
        </div>
      ))}
    </div>
  );
}
