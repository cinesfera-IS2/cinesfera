import Link from "next/link";

import type { UsuarioSesion } from "@/features/auth/session";
import { EscribirResena } from "@/features/content/components/escribir-resena";
import {
  duracionLegible,
  temporadasLegibles,
  tituloOriginalDistinto,
} from "@/features/content/lib/formato";
import type { ContenidoDetalle } from "@/features/content/types";
import { fechaLarga } from "@/features/profile/lib/fechas";

type ContentFichaProps = {
  contenido: ContenidoDetalle;
  usuario: UsuarioSesion | null;
};

export function ContentFicha({ contenido, usuario }: ContentFichaProps) {
  const tituloOriginal = tituloOriginalDistinto(contenido);
  const datos = [
    contenido.fecha_estreno && {
      etiqueta: contenido.tipo === "serie" ? "Primer episodio" : "Estreno",
      valor: fechaLarga(contenido.fecha_estreno),
    },
    contenido.duracion_minutos && {
      etiqueta: "Duración",
      valor: duracionLegible(contenido.duracion_minutos),
    },
    contenido.cantidad_temporadas && {
      etiqueta: "Temporadas",
      valor: temporadasLegibles(contenido.cantidad_temporadas),
    },
    tituloOriginal && {
      etiqueta: "Título original",
      valor: tituloOriginal,
    },
  ].filter((dato): dato is { etiqueta: string; valor: string } => Boolean(dato));

  return (
    <aside
      aria-labelledby="titulo-ficha"
      className="rounded-2xl border border-white/5 bg-night-900/60 p-6"
    >
      <h2 id="titulo-ficha" className="font-display text-lg font-bold">
        Ficha técnica
      </h2>

      {datos.length > 0 && (
        <dl className="mt-4 grid gap-4">
          {datos.map((dato) => (
            <div key={dato.etiqueta}>
              <dt className="text-xs font-semibold text-ink-400">
                {dato.etiqueta}
              </dt>
              <dd className="mt-0.5 text-sm text-ink-100">{dato.valor}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 border-t border-white/5 pt-6">
        {usuario ? (
          <>
            <p className="mb-4 text-sm text-ink-300">
              ¿Ya la viste? Contá qué te pareció.
            </p>
            <EscribirResena usuarioId={usuario.id} tituloContenido={contenido.titulo} />
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-300">
              Iniciá sesión para escribir tu reseña y responder a la comunidad.
            </p>
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-brand-600 active:scale-[0.97]"
            >
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
