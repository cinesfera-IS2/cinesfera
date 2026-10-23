"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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
}: Readonly<DesplegableProps>) {
  const pathname = usePathname();
  // Se guarda en qué página se abrió: al navegar deja de coincidir y se cierra solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn !== null && abiertoEn === pathname;
  const raiz = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
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

    // Un enlace hacia la misma página (p. ej. un #ancla) no cambia la ruta,
    // así que el cierre al elegir uno no puede depender de la navegación.
    function alElegirEnlace(evento: MouseEvent) {
      const destino = evento.target as Element;
      if (panel.current?.contains(destino) && destino.closest("a")) setAbiertoEn(null);
    }

    document.addEventListener("pointerdown", alTocarAfuera);
    document.addEventListener("keydown", alTeclear);
    document.addEventListener("click", alElegirEnlace);
    return () => {
      document.removeEventListener("pointerdown", alTocarAfuera);
      document.removeEventListener("keydown", alTeclear);
      document.removeEventListener("click", alElegirEnlace);
    };
  }, [abierto]);

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
        ref={panel}
        id={idPanel}
        data-abierto={abierto}
        className={`panel-desplegable ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
