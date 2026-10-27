import type { ReactNode } from "react";

import { NavegacionCatalogo, ResultadosEsqueleto, ResultadosPendientes } from "@/features/catalog";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingHeader } from "@/features/landing/components/landing-header";

type ListaLayoutProps = {
  titulo: string;
  descripcion: string;
  children: ReactNode;
};

/**
 * Marco de las páginas "ver todas" de la portada. Lo que no cambia al pasar de
 * página queda fijo, y el esqueleto aparece en el mismo clic que la pide.
 */
export function ListaLayout({ titulo, descripcion, children }: Readonly<ListaLayoutProps>) {
  return (
    <>
      <LandingHeader />

      <NavegacionCatalogo>
        <main className="flex-1">
          <div className="hero-halo">
            <div className="mx-auto max-w-7xl px-6 pt-10 pb-6 sm:pt-12">
              <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                {titulo}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-pretty text-ink-400 sm:text-base">
                {descripcion}
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 pt-8 pb-16">
            <ResultadosPendientes esqueleto={<ResultadosEsqueleto />}>{children}</ResultadosPendientes>
          </div>
        </main>
      </NavegacionCatalogo>

      <LandingFooter />
    </>
  );
}
