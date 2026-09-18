import { numeroCorto } from "@/features/profile/lib/fechas";
import type { EstadisticasPerfil } from "@/features/profile/types";

type ProfileStatsProps = {
  estadisticas: EstadisticasPerfil;
};

const ETIQUETAS: Array<[keyof EstadisticasPerfil, string]> = [
  ["resenas", "Reseñas"],
  ["vistas", "Vistas"],
  ["seguidores", "Seguidores"],
  ["siguiendo", "Siguiendo"],
];

export function ProfileStats({ estadisticas }: ProfileStatsProps) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ETIQUETAS.map(([clave, etiqueta]) => (
        <div
          key={clave}
          className="flex flex-col items-center gap-1 rounded-2xl border border-night-700 bg-night-900/60 px-4 py-4"
        >
          <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-500">
            {etiqueta}
          </dt>
          <dd className="font-display text-xl font-extrabold text-ink-100">
            {numeroCorto(estadisticas[clave])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
