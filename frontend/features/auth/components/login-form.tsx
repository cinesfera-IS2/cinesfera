"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/features/auth/components/auth-field";
import { recargarEn } from "@/features/auth/lib/navegacion";
import { ApiError, apiFetch } from "@/lib/api";

export function LoginForm() {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const campos = new FormData(evento.currentTarget);

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identificador: campos.get("identificador"),
          password: campos.get("password"),
        }),
      });

      recargarEn("/");
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos conectar con el servidor. Probá de nuevo en un momento."
      );

      // Solo se rehabilita al fallar: si salió bien, el botón queda quieto
      // mientras la página se recarga.
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={iniciarSesion} className="flex flex-col gap-4">
      <AuthField
        label="Correo o nombre de usuario"
        name="identificador"
        placeholder="tú@correo.com"
        autoComplete="username"
      />

      <AuthField
        label="Contraseña"
        name="password"
        type={mostrarPassword ? "text" : "password"}
        placeholder="••••••••"
        autoComplete="current-password"
        action={
          <Link
            href="#recuperar-contrasena"
            className="text-xs font-semibold text-glow-400 transition-colors hover:text-glow-300"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        }
        trailing={
          <button
            type="button"
            onClick={() => setMostrarPassword((visible) => !visible)}
            aria-label={
              mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={mostrarPassword}
            className="grid size-8 place-items-center rounded-md text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-100"
          >
            {mostrarPassword ? (
              <EyeSlashIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        }
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200"
        >
          <WarningCircleIcon
            weight="fill"
            className="mt-0.5 size-4 shrink-0 text-rose-400"
          />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 rounded-lg bg-brand-500 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:bg-brand-500/50"
      >
        {enviando ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
