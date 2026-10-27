"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { NavLink } from "@/features/landing/types";

type EnlaceDestinoProps = {
  link: NavLink;
  className: string;
  pendienteClassName: string;
  /** Reemplaza al texto visible (p. ej. un ícono); la etiqueta queda para lectores de pantalla. */
  children?: ReactNode;
};

/**
 * Un destino que todavía no existe se muestra apagado y sin `href`, para que
 * nadie haga clic en algo que no lleva a ningún lado.
 */
export function EnlaceDestino({
  link,
  className,
  pendienteClassName,
  children,
}: Readonly<EnlaceDestinoProps>) {
  const pathname = usePathname();
  const contenido = children ? (
    <>
      {children}
      <span className="sr-only">{link.label}</span>
    </>
  ) : (
    link.label
  );

  if (!link.href) {
    return (
      <span title="Próximamente" className={`cursor-not-allowed ${pendienteClassName}`}>
        {contenido}
        <span className="sr-only"> (próximamente)</span>
      </span>
    );
  }

  const actual = pathname === link.href || (pathname?.startsWith(`${link.href}/`) ?? false);

  return (
    <Link href={link.href} aria-current={actual ? "page" : undefined} className={className}>
      {contenido}
    </Link>
  );
}
