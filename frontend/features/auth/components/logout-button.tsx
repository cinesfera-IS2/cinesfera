"use client";

import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { cerrarSesion } from "@/features/auth/lib/cerrar-sesion";

export function LogoutButton() {
  const [saliendo, setSaliendo] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function salir() {
    setSaliendo(true);
    setFallo(false);

    try {
      await cerrarSesion();
    } catch {
      setFallo(true);
      setSaliendo(false);
    }
  }

  return (
    <button
      type="button"
      onClick={salir}
      disabled={saliendo}
      title={fallo ? "No pudimos cerrar la sesión. Probá de nuevo." : undefined}
      aria-label="Cerrar sesión"
      className={`grid size-9 place-items-center rounded-full border transition-colors disabled:opacity-50 ${
        fallo
          ? "border-rose-500/60 text-rose-300"
          : "border-white/20 text-ink-300 hover:border-white/40 hover:bg-white/5 hover:text-ink-100"
      }`}
    >
      <SignOutIcon weight="bold" className="size-4" />
    </button>
  );
}
