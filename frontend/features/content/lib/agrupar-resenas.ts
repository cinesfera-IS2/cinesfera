
import type { ResenaContenido } from "@/features/content/types";

export type HiloResena = {
  resena: ResenaContenido;
  respuestas: HiloResena[];
};

export function agruparResenas(
  resenas: ResenaContenido[]
): HiloResena[] {
  const hilos = new Map<string, HiloResena>();

  for (const resena of resenas) {
    hilos.set(resena.id, {
      resena,
      respuestas: [],
    });
  }

  const principales: HiloResena[] = [];

  for (const resena of resenas) {
    const hilo = hilos.get(resena.id)!;
    const padreId = resena.resena_padre_id;
    const padre = padreId ? hilos.get(padreId) : undefined;

    if (!padre || padre === hilo) {
      principales.push(hilo);
      continue;
    }

    // Evitar relaciones circulares entre reseñas.
    const visitados = new Set<string>([resena.id]);
    let actual: ResenaContenido | undefined = padre.resena;
    let hayCiclo = false;

    while (actual) {
      if (visitados.has(actual.id)) {
        hayCiclo = true;
        break;
      }

      visitados.add(actual.id);

      actual = actual.resena_padre_id
        ? hilos.get(actual.resena_padre_id)?.resena
        : undefined;
    }

    if (hayCiclo) {
      principales.push(hilo);
    } else {
      padre.respuestas.push(hilo);
    }
  }

  return principales;
}
