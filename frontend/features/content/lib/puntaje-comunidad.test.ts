import { describe, expect, it } from "vitest";

import type { ResenaContenido } from "../types";
import { puntajeComunidad } from "./puntaje-comunidad";

function resena(
  id: string,
  calificacion: number | null,
  resena_padre_id: string | null = null
): ResenaContenido {
  return {
    id,
    contenido_tmdb_id: 550,
    resena_padre_id,
    plataforma_id: null,
    calificacion,
    texto: "Texto",
    fecha: "2026-10-16T12:00:00Z",
    valoracion: 0,
    promedio_comunitario: null,
    cantidad_valoraciones: 0,
    autor: {
      id: "u1",
      nombre: "Ana",
      apellido: "Pérez",
      nombre_usuario: "ana",
      foto_url: null,
    },
  };
}

describe("puntajeComunidad", () => {
  it("promedia las reseñas principales con un decimal", () => {
    expect(
      puntajeComunidad([resena("a", 4), resena("b", 3.5), resena("c", 5)])
    ).toEqual({ promedio: 4.2, cantidad: 3 });
  });

  it("no cuenta las respuestas", () => {
    expect(
      puntajeComunidad([resena("a", 5), resena("b", 0.5, "a")])
    ).toEqual({ promedio: 5, cantidad: 1 });
  });

  it("ignora las reseñas guardadas sin nota", () => {
    expect(puntajeComunidad([resena("a", 4), resena("b", null)])).toEqual({
      promedio: 4,
      cantidad: 1,
    });
    expect(puntajeComunidad([resena("b", null)])).toBeNull();
  });

  it("devuelve null si no hay reseñas principales", () => {
    expect(puntajeComunidad([])).toBeNull();
    expect(puntajeComunidad([resena("b", 3, "a")])).toBeNull();
  });
});
