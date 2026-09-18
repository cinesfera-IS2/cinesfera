import {
  CalendarBlankIcon,
  EnvelopeSimpleIcon,
  IdentificationBadgeIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

import { mesYAnio } from "@/features/profile/lib/fechas";
import type { PerfilPublico } from "@/features/profile/types";

type ProfileDetailsProps = {
  perfil: PerfilPublico;
  /** El email solo se muestra en el perfil propio. */
  esPropio: boolean;
};

type Dato = {
  etiqueta: string;
  valor: string;
  Icon: typeof MapPinIcon;
  /** Marca el dato con la aclaración de que el resto de la gente no lo ve. */
  privado?: boolean;
};

export function ProfileDetails({ perfil, esPropio }: ProfileDetailsProps) {
  const datos: Dato[] = [
    {
      etiqueta: "Nombre completo",
      valor: `${perfil.nombre} ${perfil.apellido}`,
      Icon: IdentificationBadgeIcon,
    },
    {
      etiqueta: "Miembro desde",
      valor: mesYAnio(perfil.fechaRegistro),
      Icon: CalendarBlankIcon,
    },
  ];

  if (perfil.ubicacion) {
    datos.push({
      etiqueta: "Ubicación",
      valor: perfil.ubicacion,
      Icon: MapPinIcon,
    });
  }

  if (esPropio) {
    datos.push({
      etiqueta: "Correo electrónico",
      valor: perfil.email,
      Icon: EnvelopeSimpleIcon,
      privado: true,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Tarjeta titulo="Datos personales">
        <dl className="flex flex-col gap-4">
          {datos.map(({ etiqueta, valor, Icon, privado }) => (
            <div key={etiqueta} className="flex items-start gap-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-ink-500" />
              <div className="min-w-0">
                <dt className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-500">
                  {etiqueta}
                  {privado && (
                    <span className="rounded-full bg-night-700 px-2 py-0.5 text-[0.6rem] font-semibold normal-case tracking-normal text-ink-400">
                      Solo vos
                    </span>
                  )}
                </dt>
                <dd className="text-sm break-words text-ink-100">{valor}</dd>
              </div>
            </div>
          ))}
        </dl>
      </Tarjeta>

      {perfil.generosFavoritos.length > 0 && (
        <Tarjeta titulo="Géneros favoritos">
          <ul className="flex flex-wrap gap-2">
            {perfil.generosFavoritos.map((genero) => (
              <li
                key={genero}
                className="rounded-full border border-frame/40 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-glow-300"
              >
                {genero}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}

function Tarjeta({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-night-700 bg-night-900/60 p-5">
      <h2 className="font-display text-sm font-bold text-ink-100">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
