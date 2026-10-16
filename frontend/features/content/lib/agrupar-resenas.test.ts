
import { describe, expect, it } from "vitest";

import { agruparResenas } from "./agrupar-resenas";
import type { ResenaContenido } from "@/features/content/types";

function crearResena(
  id: string,
  padreId: string | null = null
): ResenaContenido {
  return {
    id,
    contenido_tmdb_id: 550,
    resena_padre_id: padreId,
    plataforma_id: null,
    calificacion: 4,
    texto: `Reseña ${id}`,
    fecha: "2026-10-16T12:00:00Z",
    valoracion: 0,
    autor: {
      id: "usuario-1",
      nombre: "Juan",
      apellido: "Pérez",
      nombre_usuario: "juan",
      foto_url: null,
    },
  };
}

describe("agruparResenas", () => {
  it("mantiene independientes las reseñas principales", () => {
    const resultado = agruparResenas([
      crearResena("A"),
      crearResena("B"),
    ]);

    expect(resultado.map((hilo) => hilo.resena.id)).toEqual(["A", "B"]);
  });

  it("agrupa las respuestas debajo de su reseña padre", () => {
    const resultado = agruparResenas([
      crearResena("B", "A"),
      crearResena("A"),
      crearResena("C", "A"),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].resena.id).toBe("A");
    expect(resultado[0].respuestas.map((hilo) => hilo.resena.id)).toEqual([
      "B",
      "C",
    ]);
  });

  it("admite respuestas anidadas", () => {
    const resultado = agruparResenas([
      crearResena("C", "B"),
      crearResena("A"),
      crearResena("B", "A"),
    ]);

    expect(resultado[0].respuestas[0].respuestas[0].resena.id).toBe("C");
  });

  it("mantiene visibles las respuestas con padres inexistentes", () => {
    const resultado = agruparResenas([
      crearResena("B", "inexistente"),
    ]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].resena.id).toBe("B");
  });

  it("evita ciclos entre reseñas", () => {
    const resultado = agruparResenas([
      crearResena("A", "B"),
      crearResena("B", "A"),
    ]);

    expect(resultado).toHaveLength(2);
    expect(resultado.every((hilo) => hilo.respuestas.length === 0)).toBe(true);
  });
});
