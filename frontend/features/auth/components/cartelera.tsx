import Image from "next/image";

import { postersDelCatalogo } from "@/features/catalog";

const COLUMNAS = 4;
const POR_COLUMNA = 5;
const EN_FRANJA = 6;

type Poster = { tmdbId: number; poster?: string };
type Variante = Readonly<{ variante: "muro" | "franja" }>;
/** Cada lugar de la pared, con una clave fija aunque el póster se repita. */
type Lugar = { clave: string; poster: Poster | null };

/**
 * Pared de pósters reales del catálogo, como el hall de un cine. Es pura
 * decoración: si el backend no responde quedan las siluetas vacías y el
 * formulario sigue funcionando igual.
 */
export async function Cartelera({ variante }: Variante) {
  let posters: Poster[] = [];
  try {
    posters = await postersDelCatalogo();
  } catch {
    // Sin pósters se dibujan las siluetas del esqueleto.
  }

  return variante === "muro" ? <Muro posters={posters} /> : <Franja posters={posters} />;
}

export function CarteleraEsqueleto({ variante }: Variante) {
  return variante === "muro" ? <Muro posters={[]} /> : <Franja posters={[]} />;
}

/** Repite la lista hasta cubrir `cantidad` lugares; sin pósters quedan siluetas. */
function completar(posters: Poster[], cantidad: number): Lugar[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    clave: `lugar-${indice}`,
    poster: posters.length > 0 ? posters[indice % posters.length] : null,
  }));
}

function Muro({ posters }: Readonly<{ posters: Poster[] }>) {
  const lugares = completar(posters, COLUMNAS * POR_COLUMNA);
  const columnas = Array.from({ length: COLUMNAS }, (_, columna) => ({
    clave: `columna-${columna}`,
    // Las columnas impares bajan media fila: la pared no se lee como una grilla.
    desplazada: columna % 2 === 1,
    lugares: lugares.slice(columna * POR_COLUMNA, (columna + 1) * POR_COLUMNA),
  }));

  return (
    <div className={`absolute -inset-x-20 -inset-y-32 grid -rotate-[7deg] grid-cols-4 gap-5 ${posters.length > 0 ? "proyeccion" : ""}`}>
      {columnas.map((columna) => (
        <div key={columna.clave} className={`flex flex-col gap-5 ${columna.desplazada ? "translate-y-32" : ""}`}>
          {columna.lugares.map((lugar) => (
            <Lamina key={lugar.clave} poster={lugar.poster} sizes="(min-width: 1024px) 14vw, 1px" />
          ))}
        </div>
      ))}
    </div>
  );
}

function Franja({ posters }: Readonly<{ posters: Poster[] }>) {
  return (
    <div className={`flex gap-3 ${posters.length > 0 ? "proyeccion" : ""}`}>
      {completar(posters, EN_FRANJA).map((lugar) => (
        <div key={lugar.clave} className="w-20 shrink-0 sm:w-24">
          <Lamina poster={lugar.poster} sizes="96px" />
        </div>
      ))}
    </div>
  );
}

function Lamina({ poster, sizes }: Readonly<{ poster: Poster | null; sizes: string }>) {
  return (
    <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-night-850 ring-1 ring-white/5">
      {poster?.poster && (
        <Image src={poster.poster} alt="" fill sizes={sizes} className="object-cover" />
      )}
    </div>
  );
}
