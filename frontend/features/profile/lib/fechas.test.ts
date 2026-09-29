import { describe, expect, it } from "vitest";

import { fechaLarga, mesYAnio, numeroCorto } from "./fechas";

describe("fechas", () => {
  it("mesYAnio usa el nombre del mes en español", () => {
    expect(mesYAnio("2026-03-15T10:00:00Z")).toBe("marzo de 2026");
  });

  it("fechaLarga no agrega ceros al día", () => {
    expect(fechaLarga("2026-09-04")).toBe("4 de septiembre de 2026");
  });

  it("toma el día de la fecha tal como viene, sin pasarla a otra zona horaria", () => {
    expect(fechaLarga("2026-12-31T23:30:00-03:00")).toBe(
      "31 de diciembre de 2026"
    );
  });
});

describe("numeroCorto", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1340, "1.340"],
    [1234567, "1.234.567"],
  ])("%i se muestra como %s", (valor, esperado) => {
    expect(numeroCorto(valor)).toBe(esperado);
  });
});
