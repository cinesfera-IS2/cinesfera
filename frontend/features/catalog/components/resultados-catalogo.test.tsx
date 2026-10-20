import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResultadosCatalogo } from "./resultados-catalogo";
import { buscarObras } from "@/features/catalog/data/catalogo";
import type {
  FiltrosCatalogo,
  Obra,
  PaginaCatalogo,
} from "@/features/catalog/types";

// Se reemplaza la búsqueda para que los tests no dependan del catálogo de ejemplo.
vi.mock("@/features/catalog/data/catalogo", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  buscarObras: vi.fn(),
}));

const FILTROS: FiltrosCatalogo = { orden: "populares", pagina: 1 };

function obra(tmdbId: number): Obra {
  return {
    tmdbId,
    tipo: "pelicula",
    titulo: `Obra ${tmdbId}`,
    fechaEstreno: "2000-01-01",
    posterGradient: "",
  };
}

async function renderizar(
  resultado: Partial<PaginaCatalogo>,
  filtros: FiltrosCatalogo = FILTROS
) {
  vi.mocked(buscarObras).mockResolvedValue({
    obras: [],
    pagina: 1,
    totalPaginas: 1,
    ...resultado,
  });
  render(await ResultadosCatalogo({ filtros }));
}

function textoDelResumen() {
  return screen.getByText(/^Página/).textContent?.replace(/\s+/g, " ");
}

describe("ResultadosCatalogo", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(buscarObras).mockReset();
  });

  it("busca con los filtros recibidos", async () => {
    const filtros = { ...FILTROS, texto: "matrix" };

    await renderizar({}, filtros);

    expect(buscarObras).toHaveBeenCalledWith(filtros);
  });

  it("sin resultados avisa y ofrece limpiar los filtros", async () => {
    await renderizar({ obras: [] }, { ...FILTROS, texto: "zzz" });

    expect(screen.getByRole("heading", { name: "No encontramos resultados" }))
      .toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }).getAttribute("href")
    ).toBe("/catalogo");
  });

  it("lista las obras e indica la página actual", async () => {
    await renderizar({ obras: [obra(1), obra(2)], pagina: 3, totalPaginas: 500 });

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(textoDelResumen()).toBe("Página 3 de 500");
    expect(screen.getByRole("navigation", { name: "Paginación" })).toBeTruthy();
  });

  it("no confunde una película y una serie con el mismo id de TMDB", async () => {
    await renderizar({ obras: [obra(1), { ...obra(1), tipo: "serie" }] });

    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("titula los resultados según los filtros", async () => {
    await renderizar({ obras: [obra(1)] });
    expect(screen.getByRole("heading", { name: "Últimos estrenos" })).toBeTruthy();

    cleanup();
    await renderizar({ obras: [obra(1)] }, { ...FILTROS, tipo: "pelicula", anioEstreno: 1999 });
    expect(screen.getByRole("heading", { name: "Películas de 1999" })).toBeTruthy();
  });

  it("deja quitar cada filtro activo por separado", async () => {
    await renderizar({ obras: [obra(1)] });
    expect(screen.queryByRole("list", { name: "Filtros activos" })).toBeNull();

    cleanup();
    await renderizar(
      { obras: [obra(1)] },
      { ...FILTROS, tipo: "serie", anioEstreno: 2015, pagina: 4 }
    );

    expect(
      screen.getByRole("link", { name: "Quitar filtro Series" }).getAttribute("href")
    ).toBe("/catalogo?anio=2015");
    expect(
      screen.getByRole("link", { name: "Quitar filtro 2015" }).getAttribute("href")
    ).toBe("/catalogo?tipo=serie");
  });

  it("solo ofrece limpiar todo cuando hay más de un filtro", async () => {
    await renderizar({ obras: [obra(1)] }, { ...FILTROS, tipo: "serie" });
    expect(screen.queryByRole("link", { name: "Limpiar filtros" })).toBeNull();

    cleanup();
    await renderizar({ obras: [obra(1)] }, { ...FILTROS, tipo: "serie", anioEstreno: 2015 });
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toBeTruthy();
  });
});
