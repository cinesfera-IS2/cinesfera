import Link from "next/link";

import { EnlaceAcceder } from "@/features/auth/components/enlace-acceder";
import { obtenerSesion } from "@/features/auth/session";
import { BrandLogo } from "@/features/landing/components/brand-logo";
import { EnlaceExplorar } from "@/features/landing/components/enlace-explorar";
import { MenuCuenta } from "@/features/landing/components/menu-cuenta";
import { MenuMovil } from "@/features/landing/components/menu-movil";
import { NAV_LINKS } from "@/features/landing/data/landing-content";

export async function LandingHeader() {
  const sesion = await obtenerSesion();

  return (
    <header className="cabecera sticky top-0 z-50 h-16 w-full">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-8 px-4 sm:px-6">
        <BrandLogo />

        <nav aria-label="Principal" className="hidden h-full md:block">
          <ul className="flex h-full items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href} className="haz flex h-full items-center">
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-ink-400 transition-colors hover:text-ink-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex h-full items-center gap-2 sm:gap-3">
          <div className="haz flex h-full items-center">
            <EnlaceExplorar />
          </div>

          {sesion ? (
            <MenuCuenta usuario={sesion} />
          ) : (
            <EnlaceAcceder
              className="hidden h-10 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-ink-100 transition-[background-color,border-color,transform] duration-150 ease-out hover:border-white/30 hover:bg-white/5 active:scale-[0.97] md:inline-flex"
            >
              Acceder
            </EnlaceAcceder>
          )}

          <MenuMovil usuario={sesion} />
        </div>
      </div>
    </header>
  );
}
