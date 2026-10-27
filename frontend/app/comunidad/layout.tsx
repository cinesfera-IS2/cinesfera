import type { Metadata } from "next";

import { NavegacionCatalogo, ResultadosPendientes } from "@/features/catalog";
import { BuscadorPerfiles, ResultadoEsqueleto } from "@/features/community";
import { LandingFooter, LandingHeader } from "@/features/landing";

export const metadata: Metadata = {
  title: "Comunidad — Cinesfera",
  description: "Buscá a otras personas de Cinesfera por su nombre de usuario y mirá sus reseñas.",
};

export default function ComunidadLayout({ children }: LayoutProps<"/comunidad">) {
  return (
    <>
      <LandingHeader />

      <NavegacionCatalogo>
        <main className="flex-1">
          <div className="hero-halo">
            <div className="mx-auto max-w-3xl px-6 pt-10 pb-6 sm:pt-12">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Comunidad
              </h1>
              <p className="mt-2 text-sm text-pretty text-ink-400 sm:text-base">
                Encontrá a otros cinéfilos, leé sus reseñas y seguilos.
              </p>
              <div className="mt-6">
                <BuscadorPerfiles />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-3xl px-6 pt-8 pb-16">
            <ResultadosPendientes esqueleto={<ResultadoEsqueleto />}>{children}</ResultadosPendientes>
          </div>
        </main>
      </NavegacionCatalogo>

      <LandingFooter />
    </>
  );
}
