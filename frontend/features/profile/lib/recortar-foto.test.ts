import { describe, expect, it } from "vitest";

import { calcularAreaRecorte } from "./recortar-foto";

describe("calcularAreaRecorte", () => {
  it("mueve horizontalmente el recorte de una imagen apaisada", () => {
    expect(calcularAreaRecorte(1200, 800, { x: 25, y: 50 })).toEqual({
      x: 100,
      y: 0,
      lado: 800,
    });
  });

  it("mueve verticalmente el recorte de una imagen vertical", () => {
    expect(calcularAreaRecorte(600, 1000, { x: 50, y: 75 })).toEqual({
      x: 0,
      y: 300,
      lado: 600,
    });
  });
});
