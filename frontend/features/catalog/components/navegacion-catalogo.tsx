"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";

type Navegacion = {
  navegar: (href: string, scroll?: boolean) => void;
  pendiente: boolean;
};

const NavegacionContext = createContext<Navegacion | null>(null);

/**
 * Centraliza las navegaciones dentro del catálogo en una transición para saber
 * cuándo hay una en curso. loading.tsx solo aparece al instante si Next ya lo
 * precargó (nunca en dev, y en producción no siempre a tiempo); con esto el
 * esqueleto sale en el mismo clic, sin esperar al servidor.
 */
export function NavegacionCatalogo({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  const navegar = useCallback(
    (href: string, scroll = true) => {
      startTransition(() => router.push(href, { scroll }));
    },
    [router]
  );
  const valor = useMemo(() => ({ navegar, pendiente }), [navegar, pendiente]);

  return <NavegacionContext value={valor}>{children}</NavegacionContext>;
}

export function useNavegacionCatalogo() {
  return use(NavegacionContext);
}

type ResultadosPendientesProps = {
  /** Llega desde el servidor porque los resultados no se pueden importar en el cliente. */
  esqueleto: ReactNode;
  children: ReactNode;
};

export function ResultadosPendientes({ esqueleto, children }: Readonly<ResultadosPendientesProps>) {
  const navegacion = useNavegacionCatalogo();

  return navegacion?.pendiente ? esqueleto : children;
}

type EnlaceCatalogoProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/** Link que, dentro del catálogo, muestra el esqueleto mientras carga el destino. */
export function EnlaceCatalogo({ href, scroll, ...props }: Readonly<EnlaceCatalogoProps>) {
  const navegacion = useNavegacionCatalogo();

  return (
    <Link
      {...props}
      href={href}
      scroll={scroll}
      onNavigate={(evento) => {
        if (!navegacion) return;
        evento.preventDefault();
        navegacion.navegar(href, scroll ?? true);
      }}
    />
  );
}
