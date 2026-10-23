import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { Cartelera, CarteleraEsqueleto } from "@/features/auth/components/cartelera";
import { DESTINO_POR_DEFECTO } from "@/features/auth/lib/destino";
import { BrandLogo } from "@/features/landing/components/brand-logo";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  /** A dónde se vuelve al entrar; si es una página puntual, "Volver" lleva ahí. */
  destino?: string;
};

/**
 * Envoltorio de las páginas de acceso, sin cabecera ni pie del sitio. En
 * escritorio la pantalla se parte: la cartelera a la izquierda y el
 * formulario a la derecha; en móvil la cartelera queda como una franja arriba.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer,
  destino = DESTINO_POR_DEFECTO,
}: Readonly<AuthLayoutProps>) {
  const vuelveAOrigen = destino !== DESTINO_POR_DEFECTO;

  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div aria-hidden className="relative hidden overflow-hidden lg:block">
        <Suspense fallback={<CarteleraEsqueleto variante="muro" />}>
          <Cartelera variante="muro" />
        </Suspense>
        {/* Oscurece la pared y la funde con la columna del formulario. */}
        <div className="absolute inset-0 bg-night-950/55" />
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-night-950/30 to-night-950" />
        <div className="hero-halo absolute inset-x-0 -top-40 h-[36rem] opacity-80" />
      </div>

      <div className="relative flex flex-col overflow-hidden px-5 pb-10 sm:px-8 lg:px-14 xl:px-20">
        <div
          aria-hidden
          className="pointer-events-none -mx-5 h-32 overflow-hidden px-5 pt-5 [mask-image:linear-gradient(to_bottom,black_30%,transparent)] sm:-mx-8 sm:px-8 lg:hidden"
        >
          <Suspense fallback={<CarteleraEsqueleto variante="franja" />}>
            <Cartelera variante="franja" />
          </Suspense>
        </div>

        <Link
          href={vuelveAOrigen ? destino : "/"}
          className="-ml-2 inline-flex h-11 w-fit items-center gap-2 rounded-full px-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-100 lg:mt-8"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          {vuelveAOrigen ? "Volver" : "Volver al inicio"}
        </Link>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 pt-6 lg:justify-center lg:py-12">
          <div className="flex flex-col gap-6">
            <BrandLogo size="sm" />
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance text-ink-100">
                {title}
              </h1>
              <p className="mt-2 text-pretty text-ink-400">{description}</p>
            </div>
          </div>

          {children}

          <p className="text-center text-sm text-ink-400">{footer}</p>
        </div>
      </div>
    </main>
  );
}
