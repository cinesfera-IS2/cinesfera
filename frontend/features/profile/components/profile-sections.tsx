"use client";

import {
  ChatCircleTextIcon,
  EyeIcon,
  ListBulletsIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

import { EmptyState } from "@/features/profile/components/empty-state";
import { ReviewCard } from "@/features/profile/components/review-card";
import type { ResenaPerfil, SeccionPerfil } from "@/features/profile/types";

type ProfileSectionsProps = {
  resenas: ResenaPerfil[];
  /** Nombre de pila, para el texto de la sección vacía. */
  nombre: string;
  esPropio: boolean;
};

const PESTANAS: Array<{
  id: SeccionPerfil;
  etiqueta: string;
  Icon: typeof EyeIcon;
}> = [
  { id: "resenas", etiqueta: "Reseñas", Icon: ChatCircleTextIcon },
  { id: "vistas", etiqueta: "Vistas", Icon: EyeIcon },
  { id: "listas", etiqueta: "Listas", Icon: ListBulletsIcon },
];

/**
 * Solo "Reseñas" tiene contenido: "Vistas" y "Listas" quedan reservadas con su
 * cartel para no rehacer la navegación cuando existan.
 */
export function ProfileSections({
  resenas,
  nombre,
  esPropio,
}: ProfileSectionsProps) {
  const [activa, setActiva] = useState<SeccionPerfil>("resenas");

  return (
    <section>
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="flex gap-1 border-b border-night-700"
      >
        {PESTANAS.map(({ id, etiqueta, Icon }) => {
          const seleccionada = id === activa;

          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={seleccionada}
              aria-controls={`panel-${id}`}
              onClick={() => setActiva(id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                seleccionada
                  ? "border-glow-400 text-ink-100"
                  : "border-transparent text-ink-500 hover:text-ink-300"
              }`}
            >
              <Icon
                weight={seleccionada ? "fill" : "regular"}
                className="size-4"
              />
              {etiqueta}
              {id === "resenas" && resenas.length > 0 && (
                <span className="rounded-full bg-night-700 px-2 py-0.5 text-xs text-ink-300">
                  {resenas.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${activa}`}
        aria-labelledby={`tab-${activa}`}
        className="pt-6"
      >
        {activa === "resenas" && (
          <ListaDeResenas
            resenas={resenas}
            nombre={nombre}
            esPropio={esPropio}
          />
        )}

        {activa === "vistas" && (
          <EmptyState
            Icon={EyeIcon}
            titulo="El historial todavía no está disponible"
            descripcion="Acá va a aparecer todo lo que la persona marcó como visto, con su puntaje y la fecha."
          />
        )}

        {activa === "listas" && (
          <EmptyState
            Icon={ListBulletsIcon}
            titulo="Las listas están en camino"
            descripcion="Colecciones armadas a mano: maratones, pendientes, favoritas del año."
          />
        )}
      </div>
    </section>
  );
}

function ListaDeResenas({
  resenas,
  nombre,
  esPropio,
}: ProfileSectionsProps) {
  if (resenas.length === 0) {
    return (
      <EmptyState
        Icon={ChatCircleTextIcon}
        titulo={
          esPropio ? "Todavía no escribiste reseñas" : `${nombre} no publicó reseñas`
        }
        descripcion={
          esPropio
            ? "Puntuá una película y contá qué te pareció: tu reseña va a aparecer acá."
            : "Cuando publique la primera, la vas a ver en esta sección."
        }
        accion={
          esPropio ? (
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 font-display text-sm font-bold text-white transition-colors hover:bg-brand-600"
            >
              <PencilSimpleIcon weight="bold" className="size-4" />
              Escribir una reseña
            </button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {resenas.map((resena) => (
        <ReviewCard key={resena.id} resena={resena} />
      ))}
    </div>
  );
}
