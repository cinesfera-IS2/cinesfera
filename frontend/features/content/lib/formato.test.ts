import { describe, expect, it } from "vitest";

import {
  duracionLegible,
  temporadasLegibles,
  tituloOriginalDistinto,
} from "./formato";

describe("duracionLegible", () => {
  it("separa horas y minutos", () => {
    expect(duracionLegible(139)).toBe("2 h 19 min");
  });

  it("omite los minutos en horas exactas y las horas en lo que dura menos de una", () => {
    expect(duracionLegible(120)).toBe("2 h");
    expect(duracionLegible(45)).toBe("45 min");
  });
});

describe("temporadasLegibles", () => {
  it("usa singular y plural", () => {
    expect(temporadasLegibles(1)).toBe("1 temporada");
    expect(temporadasLegibles(8)).toBe("8 temporadas");
  });
});

describe("tituloOriginalDistinto", () => {
  it("devuelve el original cuando difiere del traducido", () => {
    expect(
      tituloOriginalDistinto({ titulo: "El club de la lucha", titulo_original: "Fight Club" })
    ).toBe("Fight Club");
  });

  it("descarta el original si es el mismo título o está vacío", () => {
    expect(
      tituloOriginalDistinto({ titulo: "Matrix", titulo_original: " matrix " })
    ).toBeNull();
    expect(tituloOriginalDistinto({ titulo: "Matrix", titulo_original: "" })).toBeNull();
  });
});
