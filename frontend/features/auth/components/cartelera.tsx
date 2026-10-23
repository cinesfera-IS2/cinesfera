import Image from "next/image";

import { postersDelCatalogo } from "@/features/catalog";

const COLUMNAS = 4;
const POR_COLUMNA = 5;
const EN_FRANJA = 6;

type Poster = { tmdbId: number; poster?: string };

/**
 * Pared de pósters reales del catálogo, como el hall de un cine. Es pura
 * decoración: si el backend no responde quedan las siluetas vacías y el
 * formulario sigue funcionando igual.
 */
export async function Cartelera({ variante }: { variante: "muro" | "franja" }) {
  let posters: Poster[] = [];
  try {
    posters = await postersDelCatalogo();
  } catch {
    // Sin pósters se dibujan las siluetas del esqueleto.
  }

  return variante === "muro" ? <Muro posters={posters} /> : <Franja posters={posters} />;
}

export function CarteleraEsqueleto({ variante }: { variante: "muro" | "franja" }) {
  return variante === "muro" ? <Muro posters={[]} /> : <Franja posters={[]} />;
}

/** Repite la lista hasta cubrir `cantidad` lugares; sin pósters quedan siluetas. */
function completar(posters: Poster[], cantidad: number): (Poster | null)[] {
  return Array.from({ length: cantidad }, (_, indice) =>
    posters.length > 0 ? posters[indice % posters.length] : null
  );
}

function Muro({ posters }: { posters: Poster[] }) {
  const lugares = completar(posters, COLUMNAS * POR_COLUMNA);
  const columnas = Array.from({ length: COLUMNAS }, (_, columna) =>
    lugares.slice(columna * POR_COLUMNA, (columna + 1) * POR_COLUMNA)
  );

  return (
    <div className={`absolute -inset-x-20 -inset-y-32 grid -rotate-[7deg] grid-cols-4 gap-5 ${posters.length > 0 ? "proyeccion" : ""}`}>
      {columnas.map((columna, indice) => (
        // Las columnas impares bajan media fila: la pared no se lee como una grilla.
        <div key={indice} className={`flex flex-col gap-5 ${indice % 2 === 1 ? "translate-y-32" : ""}`}>
          {columna.map((poster, fila) => (
            <Lamina key={fila} poster={poster} sizes="(min-width: 1024px) 14vw, 1px" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Franja({ posters }: { posters: Poster[] }) {
  return (
    <div className={`flex gap-3 ${posters.length > 0 ? "proyeccion" : ""}`}>
      {completar(posters, EN_FRANJA).map((poster, indice) => (
        <div key={indice} className="w-20 shrink-0 sm:w-24">
          <Lamina poster={poster} sizes="96px" />
        </div>
      ))}
    </div>
  );
}

function Lamina({ poster, sizes }: { poster: Poster | null; sizes: string }) {
  return (
    <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-night-850 ring-1 ring-white/5">
      {poster?.poster && (
        <Image src={poster.poster} alt="" fill sizes={sizes} className="object-cover" />
      )}
    </div>
  );
}
