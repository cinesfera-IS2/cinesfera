"use client";

import {
  AtIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/features/auth/components/auth-field";
import { BotonEnvio, type EstadoEnvio } from "@/features/auth/components/boton-envio";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import { useErroresCampos } from "@/features/auth/hooks/use-errores-campos";
import { DESTINO_POR_DEFECTO, hrefAcceso } from "@/features/auth/lib/destino";
import { recargarEn } from "@/features/auth/lib/navegacion";
import {
  LARGO_MAXIMO,
  LARGO_MINIMO,
  evaluarPassword,
} from "@/features/auth/lib/password";
import { ApiError, apiFetch } from "@/lib/api";

type RegisterFormProps = {
  /** A dónde ir al terminar; ver destinoTrasAcceder. */
  destino?: string;
};

export function RegisterForm({ destino = DESTINO_POR_DEFECTO }: RegisterFormProps) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [estado, setEstado] = useState<EstadoEnvio>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const { propsCampo, validarFormulario } = useErroresCampos();

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!validarFormulario(evento.currentTarget)) return;

    setError(null);
    setEstado("enviando");

    const campos = new FormData(evento.currentTarget);
    const email = campos.get("email");
    const passwordIngresada = campos.get("password");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: campos.get("nombre"),
          apellido: campos.get("apellido"),
          nombre_usuario: campos.get("nombre_usuario"),
          email,
          password: passwordIngresada,
        }),
      });
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos conectar con el servidor. Probá de nuevo en un momento."
      );
      setEstado("inactivo");
      return;
    }

    // La cuenta ya existe: desde acá el botón confirma, aunque falten el login y la recarga.
    setEstado("listo");

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identificador: email, password: passwordIngresada }),
      });

      recargarEn(destino);
    } catch {
      // Mostrar el error acá invitaría a registrarse de nuevo y chocar con
      // "el email ya está registrado". Mejor que ingrese a mano.
      recargarEn(hrefAcceso("/login", destino));
    }
  }

  return (
    <form onSubmit={registrar} noValidate>
      <fieldset disabled={estado !== "inactivo"} className="flex min-w-0 flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="Nombre"
            name="nombre"
            placeholder="Ana"
            autoComplete="given-name"
            minLength={2}
            maxLength={50}
            {...propsCampo("nombre")}
          />

          <AuthField
            label="Apellido"
            name="apellido"
            placeholder="Torres"
            autoComplete="family-name"
            minLength={2}
            maxLength={50}
            {...propsCampo("apellido")}
          />
        </div>

        <AuthField
          label="Nombre de usuario"
          name="nombre_usuario"
          placeholder="anatorres"
          autoComplete="username"
          icon={<AtIcon weight="bold" className="size-4" />}
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9._]+"
          title="Solo minúsculas, números, puntos y guiones bajos."
          hint="Solo minúsculas, números, puntos y guiones bajos."
          value={nombreUsuario}
          // El backend lo guarda en minúsculas, así que lo mostramos como va a quedar.
          onChange={(evento) =>
            setNombreUsuario(evento.target.value.toLowerCase())
          }
          {...propsCampo("nombre_usuario")}
        />

        <AuthField
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tú@correo.com"
          autoComplete="email"
          {...propsCampo("email")}
        />

        <div className="flex flex-col gap-3">
          <AuthField
            label="Contraseña"
            name="password"
            type={mostrarPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            minLength={LARGO_MINIMO}
            maxLength={LARGO_MAXIMO}
            hint={`Mínimo ${LARGO_MINIMO} caracteres.`}
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
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

          {/* Recién aparece al escribir: antes de empezar no hay nada que medir. */}
          {password && <PasswordStrength evaluacion={evaluarPassword(password)} />}
        </div>

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
          texto="Crear cuenta"
          textoEnviando="Creando cuenta..."
          textoListo="Cuenta creada, entrando..."
        />

        <p className="text-center text-xs text-pretty text-ink-500">
          Al continuar aceptás los{" "}
          <Link href="#terminos" className="text-glow-400 hover:text-glow-300">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="#privacidad" className="text-glow-400 hover:text-glow-300">
            Privacidad
          </Link>
          .
        </p>
      </fieldset>
    </form>
  );
}
