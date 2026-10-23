"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

import { hrefAcceso } from "@/features/auth/lib/destino";

type EnlaceAccederProps = Omit<ComponentProps<typeof Link>, "href"> & {
  ruta?: "/login" | "/register";
};

/** Link a /login (o /register) que recuerda la página actual para volver a ella al entrar. */
export function EnlaceAcceder({ ruta = "/login", ...props }: EnlaceAccederProps) {
  const pathname = usePathname();
  const busqueda = useSearchParams()?.toString();
  const actual = pathname && `${pathname}${busqueda ? `?${busqueda}` : ""}`;

  return <Link {...props} href={hrefAcceso(ruta, actual)} />;
}
