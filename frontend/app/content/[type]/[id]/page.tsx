import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerSesion } from "@/features/auth/session";


import {
  ContentFicha,
  ContentHero,
  ContentReviews,
  ContentSinopsis,
  ResenasProvider,
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

  const usuario = await obtenerSesion();

  return (
  <>
      <LandingHeader />
      <main className="flex-1">
        <ResenasProvider tipo={datos.tipo} tmdbId={datos.tmdbId}>
          <ContentHero contenido={datos.contenido} />

          {/* En móvil la ficha queda entre la sinopsis y las reseñas; desde lg
              pasa a una columna lateral que acompaña el scroll. */}
          <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-2 pb-16 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-14">
            <div className="lg:col-start-1">
              <ContentSinopsis sinopsis={datos.contenido.sinopsis} />
            </div>
            <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
              <ContentFicha contenido={datos.contenido} usuario={usuario} />
            </div>
            <div className="lg:col-start-1">
              <ContentReviews usuario={usuario} />
            </div>
          </div>
        </ResenasProvider>
      </main>
      <LandingFooter />
    </>
  );
}
