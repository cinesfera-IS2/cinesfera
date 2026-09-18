import { ShieldCheckIcon, UserPlusIcon } from "@phosphor-icons/react/dist/ssr";

import { ProfileAvatar } from "@/features/profile/components/profile-avatar";
import { ProfileEditDialog } from "@/features/profile/components/profile-edit-dialog";
import { ProfileStats } from "@/features/profile/components/profile-stats";
import { mesYAnio } from "@/features/profile/lib/fechas";
import type { PerfilPublico } from "@/features/profile/types";

type ProfileHeroProps = {
  perfil: PerfilPublico;
  /** Cambia las acciones: editar el propio perfil o seguir al ajeno. */
  esPropio: boolean;
};

export function ProfileHero({ perfil, esPropio }: ProfileHeroProps) {
  return (
    <section className="border-b border-white/5">
      <div className="relative h-36 overflow-hidden bg-night-900 sm:h-48">
        <div aria-hidden className="hero-halo absolute inset-x-0 -top-40 h-96" />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-night-950 via-night-950/30 to-transparent"
        />
        {/* Franja perforada, guiño a la tira de película */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2 [background-image:radial-gradient(circle,var(--color-night-700)_2.5px,transparent_2.5px)] [background-position:8px_4px] [background-size:16px_16px]"
        />
      </div>

      {/* `relative` es necesario: la portada es un elemento posicionado y sin
          esto su degradado se pintaría por encima del nombre. */}
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
            <ProfileAvatar
              nombre={perfil.nombre}
              apellido={perfil.apellido}
              fotoUrl={perfil.fotoUrl}
            />

            <div className="min-w-0 pb-1">
              <h1 className="font-display text-2xl font-extrabold leading-snug tracking-tight text-ink-100 break-words sm:text-3xl">
                {perfil.nombre} {perfil.apellido}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm font-semibold text-glow-400">
                  @{perfil.nombreUsuario}
                </p>
                {perfil.rol === "admin" && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-frame/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-glow-300">
                    <ShieldCheckIcon weight="fill" className="size-3.5" />
                    Equipo Cinesfera
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Miembro desde {mesYAnio(perfil.fechaRegistro)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 pb-1">
            {esPropio ? (
              <ProfileEditDialog perfil={perfil} />
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                <UserPlusIcon weight="bold" className="size-4" />
                Seguir
              </button>
            )}
          </div>
        </div>

        {perfil.bio && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-300 text-pretty">
            {perfil.bio}
          </p>
        )}

        <div className="mt-6 pb-8">
          <ProfileStats estadisticas={perfil.estadisticas} />
        </div>
      </div>
    </section>
  );
}
