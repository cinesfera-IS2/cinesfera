import { describe, expect, it } from "vitest";

import { evaluarPassword } from "./password";

describe("evaluarPassword", () => {
  it("no muestra etiqueta mientras no hay nada escrito", () => {
    const evaluacion = evaluarPassword("");

    expect(evaluacion.etiqueta).toBe("");
    expect(evaluacion.nivel).toBe(0);
    expect(evaluacion.valida).toBe(false);
  });

  it("solo exige el largo mínimo, igual que el backend", () => {
    expect(evaluarPassword("Ab1!xyz").valida).toBe(false);
    expect(evaluarPassword("abcdefgh").valida).toBe(true);
  });

  it.each([
    ["abc", 0, "Muy débil"],
    ["abcdefgh", 1, "Débil"],
    ["Abcdefgh", 2, "Aceptable"],
    ["Abcdefg1", 3, "Fuerte"],
    ["Abcdef1!", 4, "Muy fuerte"],
  ])("%s tiene nivel %i (%s)", (password, nivel, etiqueta) => {
    const evaluacion = evaluarPassword(password);

    expect(evaluacion.nivel).toBe(nivel);
    expect(evaluacion.etiqueta).toBe(etiqueta);
  });

  it("cuenta las letras con tilde y la ñ como letras, no como símbolos", () => {
    const evaluacion = evaluarPassword("Ñandúes1");
    const simbolo = evaluacion.criterios.find(
      (criterio) => criterio.etiqueta === "Al menos un símbolo"
    );

    expect(simbolo?.cumple).toBe(false);
    expect(evaluacion.nivel).toBe(3);
  });
});
