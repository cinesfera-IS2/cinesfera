"use client";

import { CheckIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect, useState } from "react";

export type EstadoEnvio = "inactivo" | "enviando" | "listo";

/** Pasado este tiempo se avisa que sigue en curso: el backend puede tardar en despertar. */
const DEMORA_MS = 4000;

type BotonEnvioProps = {
  estado: EstadoEnvio;
  texto: string;
  textoEnviando: string;
  textoListo: string;
};

/**
 * Botón de envío que nunca deja la pantalla quieta: gira mientras espera al
 * servidor, confirma cuando respondió (la recarga que sigue también tarda) y
 * explica si la espera se alarga.
 */
export function BotonEnvio({ estado, texto, textoEnviando, textoListo }: BotonEnvioProps) {
  const demorado = useDemorado(estado === "enviando");

  return (
    <div>
      <button
        type="submit"
        disabled={estado !== "inactivo"}
        aria-busy={estado === "enviando"}
        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-full bg-brand-500 font-display text-[0.9375rem] font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18)] transition-[background-color,transform] duration-150 ease-out hover:bg-brand-400 active:scale-[0.98] disabled:cursor-progress disabled:bg-brand-600"
      >
        {estado === "enviando" && (
          <CircleNotchIcon aria-hidden weight="bold" className="size-4 animate-spin" />
        )}
        {estado === "listo" && <CheckIcon aria-hidden weight="bold" className="size-4" />}
        {{ inactivo: texto, enviando: textoEnviando, listo: textoListo }[estado]}
      </button>

      <p aria-live="polite" className="text-center text-xs text-pretty text-ink-400">
        {demorado && (
          <span className="mt-3 block">
            Está tardando más de lo normal: el servidor puede estar arrancando. No hace falta volver a intentar.
          </span>
        )}
      </p>
    </div>
  );
}

function useDemorado(activo: boolean): boolean {
  const [demorado, setDemorado] = useState(false);

  useEffect(() => {
    if (!activo) return;
    const temporizador = setTimeout(() => setDemorado(true), DEMORA_MS);
    return () => {
      clearTimeout(temporizador);
      setDemorado(false);
    };
  }, [activo]);

  return activo && demorado;
}
