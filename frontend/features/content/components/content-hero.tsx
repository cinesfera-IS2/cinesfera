import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";

import { PosterNoDisponible } from "@/features/catalog/components/poster-no-disponible";
import { PuntajeComunidad } from "@/features/content/components/puntaje-comunidad";
import {
  duracionLegible,
  temporadasLegibles,
  tituloOriginalDistinto,
} from "@/features/content/lib/formato";
import type { ContenidoDetalle } from "@/features/content/types";


type ContentHeroProps = {
  contenido: ContenidoDetalle;
};


export function ContentHero({ contenido }: ContentHeroProps) {
  const anio = contenido.fecha_estreno?.slice(0, 4);
  const duracion = contenido.duracion_minutos
    ? duracionLegible(contenido.duracion_minutos)
    : null;
  const temporadas = contenido.cantidad_temporadas
    ? temporadasLegibles(contenido.cantidad_temporadas)
    : null;
  const tituloOriginal = tituloOriginalDistinto(contenido);
  // Sin ninguna imagen de fondo no hay pantalla que mostrar: la cabecera se acorta.
  const conFondo = Boolean(contenido.portada_url || contenido.poster_url);

  return (
    <section className="relative isolate">
      {/* La portada hace de pantalla: se apaga hacia abajo y hacia la izquierda
          para que el texto se lea, y termina antes que la sección, así el
          póster queda medio afuera, sobre la sala. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_88%)]"
      >
        <FondoProyectado contenido={contenido} />
        <div className="absolute inset-0 bg-linear-to-r from-night-950/95 via-night-950/60 to-night-950/5" />
        <div className="absolute inset-0 bg-linear-to-t from-night-950/80 via-transparent to-night-950/40" />
      </div>

      <div
        className={`mx-auto flex max-w-6xl flex-col px-6 pt-6 pb-10 sm:pb-14 ${
          conFondo ? "min-h-[min(72dvh,44rem)]" : ""
        }`}
      >
        <Link
          href="/catalogo"
          className="-ml-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-ink-300 transition-colors hover:bg-white/5 hover:text-ink-100"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          Catálogo
        </Link>

        <div
          className={`mt-auto flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-10 ${
            conFondo ? "pt-24" : "pt-10"
          }`}
        >
          <div className="relative aspect-2/3 w-40 shrink-0 overflow-hidden rounded-xl bg-night-800 shadow-[0_28px_60px_-16px_rgb(0_0_0/0.75)] ring-1 ring-white/10 sm:w-52 lg:w-60">
            {contenido.poster_url ? (
              <Image
                src={contenido.poster_url}
                alt={`Póster de ${contenido.titulo}`}
                fill
                priority
                sizes="(min-width: 1024px) 240px, (min-width: 640px) 208px, 160px"
                className="object-cover"
              />
            ) : (
              <PosterNoDisponible />
            )}
          </div>

          <div className="min-w-0 max-w-3xl pb-1">
            <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
              {contenido.titulo}
            </h1>
            {tituloOriginal && (
              <p className="mt-2 text-lg text-ink-300 italic">{tituloOriginal}</p>
            )}

            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-300">
              <li className="font-semibold text-ink-100">
                {contenido.tipo === "pelicula" ? "Película" : "Serie"}
              </li>
              {anio && <li>{anio}</li>}
              {duracion && <li>{duracion}</li>}
              {temporadas && <li>{temporadas}</li>}
            </ul>

            {contenido.generos.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Géneros">
                {contenido.generos.map((genero) => (
                  <li
                    key={genero.id}
                    className="rounded-full border border-white/15 bg-night-950/40 px-3 py-1 text-xs font-medium text-ink-300 backdrop-blur-sm"
                  >
                    {genero.nombre}
                  </li>
                ))}
              </ul>
            )}

            <dl className="mt-7">
              <PuntajeComunidad />
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}


/** La portada; si falta, el póster agrandado y borroso; si no hay ninguno, el halo de marca. */
function FondoProyectado({ contenido }: Readonly<ContentHeroProps>) {
  if (contenido.portada_url) {
    return (
      <Image
        src={contenido.portada_url}
        alt=""
        fill
        priority
        sizes="100vw"
        className="proyeccion object-cover object-[50%_25%] opacity-60"
      />
    );
  }

  if (contenido.poster_url) {
    return (
      <Image
        src={contenido.poster_url}
        alt=""
        fill
        sizes="100vw"
        className="proyeccion scale-125 object-cover opacity-40 blur-2xl"
      />
    );
  }

  return <div className="hero-halo absolute inset-0" />;
}
