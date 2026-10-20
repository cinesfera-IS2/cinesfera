"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import { AuthField } from "@/features/auth";
import { PasswordStrength } from "@/features/auth/components/password-strength";
import {
  evaluarPassword,
  LARGO_MAXIMO,
  LARGO_MINIMO,
} from "@/features/auth/lib/password";
import { ApiError, apiFetch } from "@/lib/api";

type AccountSettingsProps = {
  usuarioId: string;
  email: string;
};

async function obtenerCsrf() {
  return apiFetch<{ csrf_token: string }>("/auth/csrf", {
    cache: "no-store",
  });
}

export function AccountSettings({ usuarioId, email }: AccountSettingsProps) {
  const router = useRouter();
  const [guardandoEmail, setGuardandoEmail] = useState(false);
  const [errorEmail, setErrorEmail] = useState<string>();
  const [exitoEmail, setExitoEmail] = useState<string>();
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string>();
  const [exitoPassword, setExitoPassword] = useState<string>();
  const [passwordNueva, setPasswordNueva] = useState("");

  async function guardarEmail(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const nuevoEmail = String(
      new FormData(evento.currentTarget).get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    if (nuevoEmail === email.toLowerCase()) {
      setExitoEmail("El correo ya estaba actualizado.");
      return;
    }

    setGuardandoEmail(true);
    setErrorEmail(undefined);
    setExitoEmail(undefined);
    try {
      const { csrf_token } = await obtenerCsrf();
      await apiFetch(`/usuarios/${usuarioId}/perfil`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrf_token },
        body: JSON.stringify({ email: nuevoEmail }),
      });
      setExitoEmail("Correo actualizado correctamente.");
      router.refresh();
    } catch (fallo) {
      setErrorEmail(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudo actualizar el correo"
      );
    } finally {
      setGuardandoEmail(false);
    }
  }

  async function guardarPassword(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const campos = new FormData(formulario);
    const passwordActual = String(campos.get("password_actual") ?? "");
    const confirmacion = String(campos.get("password_confirmacion") ?? "");
    const evaluacion = evaluarPassword(passwordNueva);

    setErrorPassword(undefined);
    setExitoPassword(undefined);
    if (!evaluacion.valida) {
      setErrorPassword(`La contraseña debe tener al menos ${LARGO_MINIMO} caracteres.`);
      return;
    }
    if (passwordNueva !== confirmacion) {
      setErrorPassword("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoPassword(true);
    try {
      const { csrf_token } = await obtenerCsrf();
      await apiFetch(`/usuarios/${usuarioId}/password`, {
        method: "PATCH",
        headers: { "X-CSRF-Token": csrf_token },
        body: JSON.stringify({
          password_actual: passwordActual,
          password_nueva: passwordNueva,
        }),
      });
      formulario.reset();
      setPasswordNueva("");
      setExitoPassword("Contraseña actualizada correctamente.");
    } catch (fallo) {
      setErrorPassword(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudo actualizar la contraseña"
      );
    } finally {
      setGuardandoPassword(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <Seccion
        titulo="Correo electrónico"
        descripcion="Es privado y también podés usarlo para iniciar sesión."
      >
        <form onSubmit={guardarEmail} className="flex flex-col gap-4">
          <AuthField
            label="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
          />
          <Mensaje error={errorEmail} exito={exitoEmail} />
          <button
            type="submit"
            disabled={guardandoEmail}
            className="self-end rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
          >
            {guardandoEmail ? "Guardando…" : "Actualizar correo"}
          </button>
        </form>
      </Seccion>

      <Seccion
        titulo="Cambiar contraseña"
        descripcion="Confirmá tu contraseña actual antes de elegir una nueva."
      >
        <form onSubmit={guardarPassword} className="flex flex-col gap-4">
          <AuthField
            label="Contraseña actual"
            name="password_actual"
            type="password"
            autoComplete="current-password"
            minLength={LARGO_MINIMO}
            maxLength={LARGO_MAXIMO}
          />
          <AuthField
            label="Contraseña nueva"
            name="password_nueva"
            type="password"
            autoComplete="new-password"
            minLength={LARGO_MINIMO}
            maxLength={LARGO_MAXIMO}
            value={passwordNueva}
            onChange={(evento) => setPasswordNueva(evento.target.value)}
          />
          <PasswordStrength evaluacion={evaluarPassword(passwordNueva)} />
          <AuthField
            label="Confirmar contraseña nueva"
            name="password_confirmacion"
            type="password"
            autoComplete="new-password"
            minLength={LARGO_MINIMO}
            maxLength={LARGO_MAXIMO}
          />
          <Mensaje error={errorPassword} exito={exitoPassword} />
          <button
            type="submit"
            disabled={guardandoPassword}
            className="self-end rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
          >
            {guardandoPassword ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </Seccion>
    </div>
  );
}

function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-night-700 bg-night-900/60 p-6">
      <h2 className="font-display text-xl font-extrabold text-ink-100">
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-ink-400">{descripcion}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Mensaje({ error, exito }: { error?: string; exito?: string }) {
  if (error) {
    return <p role="alert" className="text-sm text-red-300">{error}</p>;
  }
  if (exito) {
    return <p role="status" className="text-sm text-emerald-300">{exito}</p>;
  }
  return null;
}
