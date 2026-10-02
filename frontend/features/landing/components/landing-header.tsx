import { CompassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { BrandLogo } from "@/features/landing/components/brand-logo";
import { NAV_LINKS } from "@/features/landing/data/landing-content";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-night-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <BrandLogo />

        <div className="flex items-center gap-3 sm:gap-8">
          <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* La acción principal del sitio: por eso va rellena y con brillo,
                y no escondida entre los links del menú. */}
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-brand-500 to-glow-400 px-4 py-2 text-sm font-bold sm:px-5 text-white shadow-lg shadow-glow-400/25 transition hover:shadow-glow-400/50 hover:brightness-110"
            >
              <CompassIcon weight="bold" className="size-4" />
              Explorar
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold sm:px-5 text-ink-100 transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Acceder
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
