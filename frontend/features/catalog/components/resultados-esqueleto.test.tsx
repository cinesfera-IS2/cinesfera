import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ResultadosEsqueleto } from "./resultados-esqueleto";
import { OBRAS_POR_PAGINA } from "@/features/catalog/data/catalogo";

describe("ResultadosEsqueleto", () => {
  afterEach(cleanup);

  it("ocupa el lugar de una página completa mientras carga", () => {
    render(<ResultadosEsqueleto />);

    const esqueleto = screen.getByLabelText("Cargando catálogo");
    expect(esqueleto.getAttribute("aria-busy")).toBe("true");
    expect(screen.getAllByRole("listitem")).toHaveLength(OBRAS_POR_PAGINA);
  });
});
