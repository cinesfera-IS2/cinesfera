"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

type DesplegableProps = {
  etiqueta: string;
  boton: ReactNode;
  className?: string;
  botonClassName: string;
  panelClassName: string;
  children: ReactNode;
};

/**
 * Botón que muestra u oculta un panel. Se cierra con Escape (devolviendo el
 * foco al botón), con un clic afuera, al elegir un enlace o al cambiar de página.
 */
export function Desplegable({
  etiqueta,
  boton,
  className,
  botonClassName,
  panelClassName,
  children,
}: DesplegableProps) {
  const pathname = usePathname();
  // Se guarda en qué página se abrió: al navegar deja de coincidir y se cierra solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn !== null && abiertoEn === pathname;
  const raiz = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;

    function alTocarAfuera(evento: PointerEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAbiertoEn(null);
    }

    function alTeclear(evento: KeyboardEvent) {
      if (evento.key !== "Escape") return;
      setAbiertoEn(null);
      disparador.current?.focus();
    }

    document.addEventListener("pointerdown", alTocarAfuera);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocarAfuera);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  function alElegir(evento: MouseEvent<HTMLDivElement>) {
    if ((evento.target as HTMLElement).closest("a")) setAbiertoEn(null);
  }

  return (
    <div ref={raiz} className={className}>
      <button
        ref={disparador}
        type="button"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={idPanel}
        onClick={() => setAbiertoEn(abierto ? null : (pathname ?? ""))}
        className={botonClassName}
      >
        {boton}
      </button>

      <div
        id={idPanel}
        data-abierto={abierto}
        onClick={alElegir}
        className={`panel-desplegable ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
