import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PaginacionCatalogo } from "./paginacion-catalogo";
import type { FiltrosCatalogo } from "@/features/catalog/types";

const FILTROS: FiltrosCatalogo = { orden: "populares", pagina: 1 };

function href(etiqueta: string) {
  return screen.getByLabelText(etiqueta).getAttribute("href");
}

describe("PaginacionCatalogo", () => {
  afterEach(cleanup);

  it("no se muestra cuando hay una sola página", () => {
    const { container } = render(
      <PaginacionCatalogo filtros={FILTROS} pagina={1} totalPaginas={1} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("en la primera página no ofrece ir a la anterior", () => {
    render(<PaginacionCatalogo filtros={FILTROS} pagina={1} totalPaginas={3} />);

    expect(screen.queryByLabelText("Página anterior")).toBeNull();
    expect(href("Página siguiente")).toBe("/catalogo?pagina=2");
  });

  it("en la última página no ofrece ir a la siguiente", () => {
    render(<PaginacionCatalogo filtros={FILTROS} pagina={3} totalPaginas={3} />);

    expect(screen.queryByLabelText("Página siguiente")).toBeNull();
    expect(href("Página anterior")).toBe("/catalogo?pagina=2");
  });

  it("marca la página actual y la primera queda sin parámetro de página", () => {
    render(<PaginacionCatalogo filtros={FILTROS} pagina={2} totalPaginas={3} />);

    expect(
      screen.getByLabelText("Página 2").getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByLabelText("Página 1").getAttribute("aria-current")
    ).toBeNull();
    expect(href("Página 1")).toBe("/catalogo");
  });

  it("mantiene los filtros activos en los enlaces", () => {
    render(
      <PaginacionCatalogo
        filtros={{ ...FILTROS, texto: "matrix", genero: "accion" }}
        pagina={1}
        totalPaginas={2}
      />
    );

    expect(href("Página 2")).toBe("/catalogo?q=matrix&genero=accion&pagina=2");
  });

  it("saltea páginas intermedias cuando son muchas", () => {
    render(
      <PaginacionCatalogo filtros={FILTROS} pagina={10} totalPaginas={20} />
    );

    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByLabelText("Página 1")).toBeTruthy();
    expect(screen.getByLabelText("Página 20")).toBeTruthy();
    expect(screen.queryByLabelText("Página 5")).toBeNull();
  });
});
