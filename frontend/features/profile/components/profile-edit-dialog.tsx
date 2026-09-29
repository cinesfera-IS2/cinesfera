"use client";

import { InfoIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react/dist/ssr";
import { useRef } from "react";

import { AuthField } from "@/features/auth";
import type { PerfilPublico } from "@/features/profile/types";

type ProfileEditDialogProps = {
  perfil: PerfilPublico;
};

/**
 * El formulario todavía no guarda. El submit tiene que llamar a
 * `PATCH /usuarios/{id}/perfil` con los campos que cambiaron (ver
 * `UsuarioActualizacion` en el backend) y refrescar la ruta al volver.
 */
export function ProfileEditDialog({ perfil }: ProfileEditDialogProps) {
  const dialogo = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogo.current?.showModal()}
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
          method="dialog"
          onSubmit={(evento) => {
            evento.preventDefault();
            dialogo.current?.close();
          }}
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
            label="Correo electrónico"
            name="email"
            type="email"
            defaultValue={perfil.email ?? ""}
            autoComplete="email"
          />

          <AuthField
            label="Foto de perfil (URL)"
            name="foto_url"
            type="url"
            required={false}
            defaultValue={perfil.fotoUrl ?? ""}
            placeholder="https://..."
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

          <p className="flex items-start gap-2 rounded-lg border border-night-600 bg-night-900/60 px-3 py-2.5 text-xs text-ink-400">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-glow-400" />
            Diseño preliminar: el formulario todavía no guarda. Se conecta con
            el backend cuando esté listo el inicio de sesión.
          </p>

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
              className="rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
