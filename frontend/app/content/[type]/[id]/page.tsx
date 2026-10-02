import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ContentHero,
  ContentReviews,
  obtenerContenido,
  type TipoContenido,
} from "@/features/content";
import { LandingFooter, LandingHeader } from "@/features/landing";


function esTipoContenido(valor: string): valor is TipoContenido {
  return valor === "pelicula" || valor === "serie";
}


async function resolverContenido(params: Promise<{ type: string; id: string }>) {
  const { type, id } = await params;
  const tmdbId = Number(id);

  if (!esTipoContenido(type) || !Number.isInteger(tmdbId) || tmdbId <= 0) {
    return null;
  }

  const contenido = await obtenerContenido(type, tmdbId);
  return contenido ? { contenido, tipo: type, tmdbId } : null;
}


export async function generateMetadata({
  params,
}: PageProps<"/content/[type]/[id]">): Promise<Metadata> {
  const datos = await resolverContenido(params);

  if (!datos) return { title: "Contenido no encontrado — Cinesfera" };

  return {
    title: `${datos.contenido.titulo} — Cinesfera`,
    description:
      datos.contenido.sinopsis ||
      `Ficha, puntuación y reseñas de ${datos.contenido.titulo}.`,
  };
}


export default async function ContentPage({
  params,
}: PageProps<"/content/[type]/[id]">) {
  const datos = await resolverContenido(params);

  if (!datos) notFound();

  return (
    <>
      <LandingHeader />
      <main className="flex-1">
        <ContentHero contenido={datos.contenido} />
        <div className="mx-auto max-w-4xl px-6 py-10">
          <ContentReviews tipo={datos.tipo} tmdbId={datos.tmdbId} />
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
