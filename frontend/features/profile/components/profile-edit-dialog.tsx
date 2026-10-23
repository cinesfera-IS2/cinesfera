"use client";

import {
  CheckIcon,
  InfoIcon,
  PencilSimpleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { AuthField } from "@/features/auth";
import type { PerfilPublico } from "@/features/profile/types";
import { ApiError, apiFetch } from "@/lib/api";

type ProfileEditDialogProps = {
  perfil: PerfilPublico;
};

type Genero = {
  id: number;
  nombre: string;
};

const LIMITE_GENEROS = 5;

export function ProfileEditDialog({ perfil }: ProfileEditDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();
  const [cargandoGeneros, setCargandoGeneros] = useState(false);
  const [generosDisponibles, setGenerosDisponibles] = useState<Genero[]>();
  const [generosSeleccionados, setGenerosSeleccionados] = useState<string[]>(
    perfil.generosFavoritos
  );

  async function abrir() {
    setError(undefined);
    setGenerosSeleccionados(perfil.generosFavoritos);
    dialogo.current?.showModal();

    if (generosDisponibles) return;

    setCargandoGeneros(true);
    try {
      setGenerosDisponibles(
        await apiFetch<Genero[]>("/contenidos/generos", { cache: "no-store" })
      );
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron cargar los géneros disponibles"
      );
    } finally {
      setCargandoGeneros(false);
    }
  }

  function alternarGenero(nombre: string) {
    setGenerosSeleccionados((actuales) => {
      if (actuales.includes(nombre)) {
        return actuales.filter((genero) => genero !== nombre);
      }
      if (actuales.length >= LIMITE_GENEROS) return actuales;
      return [...actuales, nombre];
    });
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const campos = new FormData(evento.currentTarget);
    const texto = (nombre: string) => String(campos.get(nombre) ?? "").trim();
    const cambios: Record<string, string | string[] | null> = {};

    const nombre = texto("nombre");
    const apellido = texto("apellido");
    const nombreUsuario = texto("nombre_usuario").toLowerCase();
    const fotoUrl = texto("foto_url");
    const bio = texto("bio");
    const ubicacion = texto("ubicacion");
    const generosFavoritos = generosSeleccionados;

    if (nombre !== perfil.nombre) cambios.nombre = nombre;
    if (apellido !== perfil.apellido) cambios.apellido = apellido;
    if (nombreUsuario !== perfil.nombreUsuario) {
      cambios.nombre_usuario = nombreUsuario;
    }
    if (fotoUrl !== (perfil.fotoUrl ?? "")) cambios.foto_url = fotoUrl || null;
    if (bio !== (perfil.bio ?? "")) cambios.bio = bio || null;
    if (ubicacion !== (perfil.ubicacion ?? "")) {
      cambios.ubicacion = ubicacion || null;
    }
    if (generosFavoritos.join("|") !== perfil.generosFavoritos.join("|")) {
      cambios.generos_favoritos = generosFavoritos;
    }

    if (Object.keys(cambios).length === 0) {
      dialogo.current?.close();
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      const { csrf_token } = await apiFetch<{ csrf_token: string }>(
        "/auth/csrf",
        { cache: "no-store" }
      );
      const actualizado = await apiFetch<{ nombre_usuario: string }>(
        `/usuarios/${perfil.id}/perfil`,
        {
          method: "PATCH",
          headers: { "X-CSRF-Token": csrf_token },
          body: JSON.stringify(cambios),
        }
      );

      dialogo.current?.close();
      if (actualizado.nombre_usuario !== perfil.nombreUsuario) {
        router.replace(
          `/profile/${encodeURIComponent(actualizado.nombre_usuario)}`
        );
      } else {
        router.refresh();
      }
    } catch (fallo) {
      setError(
        fallo instanceof ApiError
          ? fallo.message
          : "No se pudieron guardar los cambios"
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-100 transition-colors hover:border-white/40 hover:bg-white/5"
      >
        <PencilSimpleIcon weight="bold" className="size-4" />
        Editar perfil
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby="titulo-editar-perfil"
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-night-600 bg-night-850 p-0 text-ink-100 shadow-2xl shadow-black/60 backdrop:bg-night-950/80 backdrop:backdrop-blur-sm"
      >
        <form
          onSubmit={guardar}
          className="flex flex-col gap-5 p-6 sm:p-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="titulo-editar-perfil"
                className="font-display text-xl font-extrabold tracking-tight"
              >
                Editar perfil
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Los cambios se ven en tu perfil público.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              aria-label="Cerrar"
              className="grid size-8 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-100"
            >
              <XIcon weight="bold" className="size-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField
              label="Nombre"
              name="nombre"
              defaultValue={perfil.nombre}
              maxLength={50}
            />
            <AuthField
              label="Apellido"
              name="apellido"
              defaultValue={perfil.apellido}
              maxLength={50}
            />
          </div>

          <AuthField
            label="Nombre de usuario"
            name="nombre_usuario"
            defaultValue={perfil.nombreUsuario}
            maxLength={30}
            pattern="[a-z0-9._]+"
            icon={<span className="text-sm">@</span>}
          />

          <AuthField
            label="Foto de perfil (URL)"
            name="foto_url"
            type="url"
            required={false}
            defaultValue={perfil.fotoUrl ?? ""}
            placeholder="https://..."
          />

          <AuthField
            label="Ubicación"
            name="ubicacion"
            required={false}
            maxLength={100}
            defaultValue={perfil.ubicacion ?? ""}
            placeholder="Montevideo, Uruguay"
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="bio"
              className="text-xs font-semibold uppercase tracking-wider text-ink-400"
            >
              Sobre vos
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={280}
              defaultValue={perfil.bio ?? ""}
              placeholder="Contá qué tipo de cine te gusta."
              className="w-full resize-none rounded-lg border border-night-600 bg-night-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition-colors focus:border-brand-400"
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              Géneros favoritos
            </legend>
            <span
              aria-live="polite"
              className="-mt-6 self-end text-xs font-semibold text-ink-500"
            >
              {generosSeleccionados.length} de {LIMITE_GENEROS} seleccionados
            </span>

            {cargandoGeneros && (
              <p className="text-sm text-ink-400">Cargando géneros…</p>
            )}

            {generosDisponibles && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {generosDisponibles.map((genero) => {
                  const seleccionado = generosSeleccionados.includes(
                    genero.nombre
                  );
                  const deshabilitado =
                    !seleccionado &&
                    generosSeleccionados.length >= LIMITE_GENEROS;

                  return (
                    <button
                      key={genero.id}
                      type="button"
                      aria-pressed={seleccionado}
                      disabled={deshabilitado}
                      onClick={() => alternarGenero(genero.nombre)}
                      className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                        seleccionado
                          ? "border-brand-400 bg-brand-500/20 text-ink-100"
                          : "border-night-600 bg-night-900 text-ink-300 hover:border-white/30 hover:bg-white/5"
                      } disabled:cursor-not-allowed disabled:opacity-35`}
                    >
                      <span>{genero.nombre}</span>
                      {seleccionado && (
                        <CheckIcon
                          weight="bold"
                          aria-hidden="true"
                          className="size-4 shrink-0 text-glow-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-ink-500">
              Elegí hasta cinco opciones.
            </p>
          </fieldset>

          <p className="flex items-start gap-2 rounded-lg border border-night-600 bg-night-900/60 px-3 py-2.5 text-xs text-ink-400">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-glow-400" />
            El correo y la contraseña se administran desde la configuración de
            la cuenta.
            <Link
              href="/configuracion/cuenta"
              onClick={() => dialogo.current?.close()}
              className="shrink-0 font-semibold text-glow-400 hover:text-glow-300"
            >
              Ir a configuración
            </Link>
          </p>

          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-ink-300 transition-colors hover:border-white/40 hover:text-ink-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              aria-busy={guardando}
              className="rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
