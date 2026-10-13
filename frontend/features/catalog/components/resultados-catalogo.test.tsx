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

function obra(id: string): Obra {
  return {
    id,
    tipo: "pelicula",
    titulo: id,
    fechaEstreno: "2000-01-01",
    generos: ["drama"],
    calificacion: 4,
    popularidad: 50,
    posterGradient: "",
  };
}

async function renderizar(
  resultado: Partial<PaginaCatalogo>,
  filtros: FiltrosCatalogo = FILTROS
) {
  vi.mocked(buscarObras).mockResolvedValue({
    obras: [],
    total: 0,
    pagina: 1,
    totalPaginas: 1,
    porPagina: 20,
    ...resultado,
  });
  render(await ResultadosCatalogo({ filtros }));
}

function textoDelResumen() {
  return screen.getByText(/^Mostrando/).textContent?.replace(/\s+/g, " ");
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
    await renderizar({ total: 0 }, { ...FILTROS, texto: "zzz" });

    expect(screen.getByRole("heading", { name: "No encontramos resultados" }))
      .toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }).getAttribute("href")
    ).toBe("/catalogo");
  });

  it("lista las obras y resume cuántas se muestran", async () => {
    await renderizar({ obras: [obra("a"), obra("b")], total: 2 });

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(textoDelResumen()).toBe("Mostrando 1–2 de 2 títulos");
  });

  it("usa el singular cuando hay un solo título", async () => {
    await renderizar({ obras: [obra("a")], total: 1 });

    expect(textoDelResumen()).toBe("Mostrando 1–1 de 1 título");
  });

  it("calcula el rango a partir de la página actual", async () => {
    await renderizar({
      obras: [obra("u")],
      total: 41,
      pagina: 3,
      totalPaginas: 3,
    });

    expect(textoDelResumen()).toBe("Mostrando 41–41 de 41 títulos");
    expect(screen.getByRole("navigation", { name: "Paginación" })).toBeTruthy();
  });

  it("solo ofrece limpiar filtros si hay alguno activo", async () => {
    await renderizar({ obras: [obra("a")], total: 1 });
    expect(screen.queryByRole("link", { name: "Limpiar filtros" })).toBeNull();

    cleanup();
    await renderizar(
      { obras: [obra("a")], total: 1 },
      { ...FILTROS, genero: "drama" }
    );
    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toBeTruthy();
  });
});
