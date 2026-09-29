"use client";

import {
  AtIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/features/auth/components/auth-field";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import {
  LARGO_MAXIMO,
  LARGO_MINIMO,
  evaluarPassword,
} from "@/features/auth/lib/password";
import { ApiError, apiFetch } from "@/lib/api";

export function RegisterForm() {
  const router = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluacion = evaluarPassword(password);

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    const campos = new FormData(evento.currentTarget);

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nombre: campos.get("nombre"),
          apellido: campos.get("apellido"),
          nombre_usuario: campos.get("nombre_usuario"),
          email: campos.get("email"),
          password: campos.get("password"),
        }),
      });

      // La idea es que acá se inicie sesión sola con las mismas credenciales y
      // recién después se navegue. Mientras eso no exista, la cuenta queda
      // creada pero la persona llega a la portada sin sesión.
      //
      // `replace` y no `push`: volver atrás no debe traer de nuevo un
      // formulario que ya se envió.
      router.replace("/");
    } catch (problema) {
      setError(
        problema instanceof ApiError
          ? problema.message
          : "No pudimos conectar con el servidor. Probá de nuevo en un momento."
      );

      // Solo se rehabilita al fallar: si salió bien, el botón queda quieto
      // mientras se navega, en lugar de volver a decir "Crear cuenta".
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={registrar} className="flex flex-col gap-5">
      {/* En pantallas anchas los campos se reparten en dos columnas para que el
          formulario no quede como una tira larguísima. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <AuthField
            label="Nombre"
            name="nombre"
            placeholder="Ana"
            autoComplete="given-name"
            minLength={2}
            maxLength={50}
          />

          <AuthField
            label="Apellido"
            name="apellido"
            placeholder="Torres"
            autoComplete="family-name"
            minLength={2}
            maxLength={50}
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
          value={nombreUsuario}
          // El backend lo guarda en minúsculas, así que lo mostramos como va a quedar.
          onChange={(evento) =>
            setNombreUsuario(evento.target.value.toLowerCase())
          }
        />

        <AuthField
          label="Correo electrónico"
          name="email"
          type="email"
          placeholder="tú@correo.com"
          autoComplete="email"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="Contraseña"
          name="password"
          type={mostrarPassword ? "text" : "password"}
          placeholder={`Mínimo ${LARGO_MINIMO} caracteres`}
          autoComplete="new-password"
          minLength={LARGO_MINIMO}
          maxLength={LARGO_MAXIMO}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
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

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Seguridad
          </p>
          <PasswordStrength evaluacion={evaluacion} />
        </div>
      </div>

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
        className="rounded-lg bg-brand-500 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:bg-brand-500/50"
      >
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-xs text-ink-500 text-pretty">
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
    </form>
  );
}
