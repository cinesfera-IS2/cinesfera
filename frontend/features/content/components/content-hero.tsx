import { StarIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

import type { ContenidoDetalle } from "@/features/content/types";


type ContentHeroProps = {
  contenido: ContenidoDetalle;
};


export function ContentHero({ contenido }: ContentHeroProps) {
  const anio = contenido.fecha_estreno?.slice(0, 4);
  const duracion = contenido.duracion_minutos
    ? `${contenido.duracion_minutos} min`
    : null;
  const temporadas = contenido.cantidad_temporadas
    ? `${contenido.cantidad_temporadas} ${
        contenido.cantidad_temporadas === 1 ? "temporada" : "temporadas"
      }`
    : null;

  return (
    <section className="relative isolate overflow-hidden border-b border-white/5">
      {contenido.portada_url && (
        <Image
          src={contenido.portada_url}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-20"
        />
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-night-950 via-night-950/85 to-night-900/55" />

      <div className="mx-auto flex max-w-6xl flex-col gap-7 px-6 py-12 sm:flex-row sm:items-end lg:py-16">
        <div className="relative aspect-2/3 w-36 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-night-800 shadow-2xl sm:w-48">
          {contenido.poster_url ? (
            <Image
              src={contenido.poster_url}
              alt={`Póster de ${contenido.titulo}`}
              fill
              priority
              sizes="(min-width: 640px) 192px, 144px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-ink-500">
              Póster no disponible
            </div>
          )}
        </div>

        <div className="max-w-3xl pb-1">
          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-glow-300 uppercase">
            {contenido.tipo === "pelicula" ? "Película" : "Serie"}
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            {contenido.titulo}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-300">
            {anio && <span>{anio}</span>}
            {duracion && <span>{duracion}</span>}
            {temporadas && <span>{temporadas}</span>}
            <span className="flex items-center gap-1 text-glow-300">
              <StarIcon weight="fill" className="size-4" />
              {contenido.calificacion_tmdb.toFixed(1)} / 10
            </span>
          </div>
          {contenido.generos.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Géneros">
              {contenido.generos.map((genero) => (
                <li
                  key={genero.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-300"
                >
                  {genero.nombre}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 max-w-2xl leading-relaxed text-ink-300">
            {contenido.sinopsis || "La sinopsis todavía no está disponible."}
          </p>
        </div>
      </div>
    </section>
  );
}
