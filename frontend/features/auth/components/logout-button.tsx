"use client";

import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { cerrarSesion } from "@/features/auth/lib/cerrar-sesion";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "" }: Readonly<LogoutButtonProps>) {
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
      className={`${className} disabled:opacity-50 ${fallo ? "text-rose-300" : ""}`}
    >
      <SignOutIcon weight="bold" className="size-4" />
      Cerrar sesión
    </button>
  );
}
