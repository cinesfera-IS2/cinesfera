"use client";

import {
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/features/auth/components/auth-field";
import { BotonEnvio, type EstadoEnvio } from "@/features/auth/components/boton-envio";
import { useErroresCampos } from "@/features/auth/hooks/use-errores-campos";
import { DESTINO_POR_DEFECTO } from "@/features/auth/lib/destino";
import { recargarEn } from "@/features/auth/lib/navegacion";
import { ApiError, apiFetch } from "@/lib/api";

type LoginFormProps = {
  /** A dónde ir al entrar; ver destinoTrasAcceder. */
  destino?: string;
};

export function LoginForm({ destino = DESTINO_POR_DEFECTO }: Readonly<LoginFormProps>) {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const { propsCampo, validarFormulario } = useErroresCampos();

  async function iniciarSesion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!validarFormulario(evento.currentTarget)) return;

    setError(null);
    setEstado("enviando");

    const campos = new FormData(evento.currentTarget);

    try {
      const sesion = await apiFetch<{ rol?: "usuario" | "admin" }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identificador: campos.get("identificador"),
          password: campos.get("password"),
        }),
      });

      // La recarga también demora: el botón queda confirmando hasta que llega la página.
      setEstado("listo");
      recargarEn(sesion?.rol === "admin" ? "/admin" : destino);
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos conectar con el servidor. Probá de nuevo en un momento."
      );
      setEstado("inactivo");
    }
  }

  return (
    <form onSubmit={iniciarSesion} noValidate>
      <fieldset disabled={estado !== "inactivo"} className="flex min-w-0 flex-col gap-5">
        <AuthField
          label="Correo o nombre de usuario"
          name="identificador"
          placeholder="tú@correo.com"
          autoComplete="username"
          {...propsCampo("identificador")}
        />

        <AuthField
          label="Contraseña"
          name="password"
          type={mostrarPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          {...propsCampo("password")}
          trailing={
            <button
              type="button"
              onClick={() => setMostrarPassword((visible) => !visible)}
              aria-label={
                mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={mostrarPassword}
              className="grid size-10 place-items-center rounded-md text-ink-500 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              {mostrarPassword ? (
                <EyeSlashIcon className="size-5" />
              ) : (
                <EyeIcon className="size-5" />
              )}
            </button>
          }
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
          >
            <WarningCircleIcon
              weight="fill"
              className="mt-0.5 size-4 shrink-0 text-rose-400"
            />
            {error}
          </p>
        )}

        <BotonEnvio
          estado={estado}
          texto="Iniciar sesión"
          textoEnviando="Ingresando..."
          textoListo="Listo, entrando..."
        />
      </fieldset>
    </form>
  );
}
