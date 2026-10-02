import { describe, expect, it } from "vitest";

import { OBRAS_POR_PAGINA, buscarObras } from "./catalogo";
import { OBRAS } from "./obras";

describe("buscarObras", () => {
  it("pagina el catálogo completo cuando no hay filtros", async () => {
    const resultado = await buscarObras({ orden: "populares", pagina: 1 });

    expect(resultado.total).toBe(OBRAS.length);
    expect(resultado.obras).toHaveLength(Math.min(OBRAS_POR_PAGINA, OBRAS.length));
    expect(resultado.porPagina).toBe(OBRAS_POR_PAGINA);
  });

  it("aplica los filtros sobre el catálogo", async () => {
    const resultado = await buscarObras({
      orden: "populares",
      pagina: 1,
      tipo: "serie",
    });

    expect(resultado.total).toBeGreaterThan(0);
    expect(resultado.obras.every((obra) => obra.tipo === "serie")).toBe(true);
  });
});
