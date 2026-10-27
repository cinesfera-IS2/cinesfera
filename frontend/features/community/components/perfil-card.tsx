import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import type { PerfilPublico } from "@/features/profile/types";

export function PerfilCard({ perfil }: Readonly<{ perfil: PerfilPublico }>) {
  const { nombre, apellido, nombreUsuario, fotoUrl, bio, estadisticas } = perfil;
  const iniciales = `${nombre.at(0) ?? ""}${apellido.at(0) ?? ""}`.toUpperCase();

  return (
    <Link
      href={`/profile/${nombreUsuario}`}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-night-900/60 p-4 transition-[background-color,border-color] duration-150 ease-out hover:border-white/20 hover:bg-night-850 sm:gap-5 sm:p-5"
    >
      <span
        aria-hidden
        className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-linear-to-br from-brand-500 to-glow-400 font-display text-lg font-extrabold text-white ring-1 ring-white/15 sm:size-16"
      >
        {fotoUrl ? <Image src={fotoUrl} alt="" fill sizes="64px" className="object-cover" /> : iniciales}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-base font-bold text-ink-100">
          {nombre} {apellido}
        </span>
        <span className="block truncate text-sm text-ink-400">@{nombreUsuario}</span>
        {bio ? <span className="mt-1.5 line-clamp-2 text-sm text-pretty text-ink-300">{bio}</span> : null}
        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-400 tabular-nums">
          <span>
            <strong className="font-semibold text-ink-100">{estadisticas.resenas}</strong>{" "}
            {estadisticas.resenas === 1 ? "reseña" : "reseñas"}
          </span>
          <span>
            <strong className="font-semibold text-ink-100">{estadisticas.seguidores}</strong>{" "}
            {estadisticas.seguidores === 1 ? "seguidor" : "seguidores"}
          </span>
          <span>
            <strong className="font-semibold text-ink-100">{estadisticas.siguiendo}</strong> siguiendo
          </span>
        </span>
      </span>

      <CaretRightIcon
        weight="bold"
        aria-hidden
        className="size-5 shrink-0 text-ink-500 transition-[color,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-ink-100"
      />
    </Link>
  );
}
