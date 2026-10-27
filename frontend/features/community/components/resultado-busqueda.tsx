import {
  MagnifyingGlassIcon,
  UsersThreeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { PerfilCard } from "@/features/community/components/perfil-card";
import { esNombreUsuarioValido } from "@/features/community/lib/consulta";
import { buscarPerfil } from "@/features/profile";

/** `consulta` llega ya normalizada (sin arroba y en minúsculas). */
export async function ResultadoBusqueda({ consulta }: Readonly<{ consulta: string }>) {
  if (!consulta) {
    return (
      <Aviso
        icono={<UsersThreeIcon className="size-6" />}
        titulo="Encontrá a otros cinéfilos"
        descripcion="Escribí el nombre de usuario de alguien para ver su perfil, leer sus reseñas y seguirlo."
      />
    );
  }

  const perfil = esNombreUsuarioValido(consulta)
    ? await buscarPerfil(consulta).catch(() => undefined)
    : null;

  if (perfil === undefined) {
    return (
      <Aviso
        icono={<WarningCircleIcon className="size-6" />}
        titulo="No pudimos buscar ahora"
        descripcion="Probá de nuevo en un rato."
      />
    );
  }

  if (!perfil) {
    return (
      <Aviso
        icono={<MagnifyingGlassIcon className="size-6" />}
        titulo={`No encontramos a @${consulta}`}
        descripcion="Revisá que el nombre de usuario esté completo y bien escrito: la búsqueda es exacta."
      />
    );
  }

  return (
    <>
      {/* Ocupa el mismo alto que la barra del esqueleto, así nada salta al cargar. */}
      <p className="mb-6 flex h-8 items-center text-sm text-ink-400">
        Resultado para <span className="ml-1 font-semibold text-ink-100">@{consulta}</span>
      </p>
      <PerfilCard perfil={perfil} />
    </>
  );
}

type AvisoProps = {
  icono: ReactNode;
  titulo: string;
  descripcion: string;
};

function Aviso({ icono, titulo, descripcion }: Readonly<AvisoProps>) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-night-600 bg-night-900/40 px-6 py-14 text-center">
      <span aria-hidden className="grid size-12 place-items-center rounded-full bg-night-800 text-ink-400">
        {icono}
      </span>
      <h2 className="font-display text-base font-bold text-pretty text-ink-100">{titulo}</h2>
      <p className="max-w-sm text-sm text-pretty text-ink-400">{descripcion}</p>
    </div>
  );
}
