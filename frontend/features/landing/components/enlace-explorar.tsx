"use client";

import { CompassIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** La acción principal del sitio: va rellena y fuera del menú, no escondida entre los links. */
export function EnlaceExplorar() {
  const enCatalogo = usePathname()?.startsWith("/catalogo") ?? false;

  return (
    <Link
      href="/catalogo"
      aria-current={enCatalogo ? "page" : undefined}
      className="inline-flex size-11 items-center justify-center gap-2 rounded-full bg-brand-500 text-sm font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.97] sm:h-10 sm:w-auto sm:px-4"
    >
      <CompassIcon weight="bold" className="size-4" />
      {/* En móvil queda solo el ícono para que entren el logo y el menú. */}
      <span className="sr-only sm:not-sr-only">Explorar</span>
    </Link>
  );
}
