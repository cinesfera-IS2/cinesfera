import { describe, expect, it } from "vitest";

import { esNombreUsuarioValido, hrefComunidad, normalizarConsulta } from "./consulta";

describe("normalizarConsulta", () => {
  it("saca espacios, la arroba y las mayúsculas", () => {
    expect(normalizarConsulta("  @AnaTorres ")).toBe("anatorres");
  });

  it("toma el primer valor si la URL repite el parámetro", () => {
    expect(normalizarConsulta(["ana", "beto"])).toBe("ana");
  });

  it("sin consulta devuelve texto vacío", () => {
    expect(normalizarConsulta(undefined)).toBe("");
  });
});

describe("esNombreUsuarioValido", () => {
  it.each(["ana", "ana.torres_99"])("acepta %s", (nombre) => {
    expect(esNombreUsuarioValido(nombre)).toBe(true);
  });

  it.each(["an", "ana torres", "ana/../x", "a".repeat(31)])("rechaza %s", (nombre) => {
    expect(esNombreUsuarioValido(nombre)).toBe(false);
  });
});

describe("hrefComunidad", () => {
  it("lleva la consulta normalizada en la URL", () => {
    expect(hrefComunidad(" @Ana ")).toBe("/comunidad?q=ana");
  });

  it("sin consulta vuelve a la página sola", () => {
    expect(hrefComunidad("  ")).toBe("/comunidad");
  });
});
