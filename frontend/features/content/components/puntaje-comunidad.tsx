"use client";

import { Puntaje } from "@/features/content/components/puntaje";
import { useResenas } from "@/features/content/components/resenas-provider";
import { puntajeComunidad } from "@/features/content/lib/puntaje-comunidad";

export function PuntajeComunidad() {
  const resenas = useResenas();

  // Si las reseñas no cargan, el listado ya muestra el error; acá alcanza con no mostrar nada.
  if (!resenas || resenas.estado.estado === "error") return null;

  if (resenas.estado.estado === "cargando") {
    return (
      <div className="flex min-w-24 flex-col gap-1" aria-busy="true">
        <dt className="text-xs font-semibold text-ink-400">Cinesfera</dt>
        <dd className="h-10">
          <span className="block h-full w-20 animate-pulse rounded-md bg-white/10" />
        </dd>
      </div>
    );
  }

  const puntaje = puntajeComunidad(resenas.estado.resenas);

  if (!puntaje) {
    return (
      <Puntaje
        fuente="Cinesfera"
        valor={<span className="text-base font-semibold text-ink-300">Sin reseñas</span>}
      />
    );
  }

  return (
    <Puntaje
      fuente="Cinesfera"
      valor={puntaje.promedio.toFixed(1)}
      escala={5}
      detalle={`${puntaje.cantidad} ${puntaje.cantidad === 1 ? "reseña" : "reseñas"}`}
      destacado
    />
  );
}
