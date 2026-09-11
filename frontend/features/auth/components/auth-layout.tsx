import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/features/landing/components/brand-logo";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Envoltorio de las páginas de acceso: tarjeta centrada, sin cabecera ni pie del sitio. */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="hero-halo pointer-events-none absolute inset-x-0 -top-64 h-[42rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-[26rem] size-[32rem] -translate-x-1/2 rounded-full bg-brand-500/45 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-[27rem] size-[34rem] -translate-x-1/2 rounded-full bg-glow-400/20 blur-3xl"
      />

      <div className="relative flex w-full max-w-md flex-col gap-4">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          Volver al inicio
        </Link>

        <div className="overflow-hidden rounded-2xl border border-night-600 bg-night-850/90 shadow-2xl shadow-black/40 backdrop-blur">
          {/* Franja perforada, guiño a la tira de película */}
          <div
            aria-hidden
            className="h-2 [background-image:radial-gradient(circle,var(--color-night-700)_2.5px,transparent_2.5px)] [background-position:8px_4px] [background-size:16px_16px]"
          />

          <div className="flex flex-col gap-6 px-8 pb-8 pt-3 sm:px-10">
            <BrandLogo size="sm" />

            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink-100">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-ink-400 text-pretty">
                {description}
              </p>
            </div>

            {children}

            <div className="border-t border-night-600 pt-5 text-center text-sm text-ink-400">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
