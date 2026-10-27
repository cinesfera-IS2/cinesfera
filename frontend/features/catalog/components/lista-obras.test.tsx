import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Obra } from "@/features/catalog/types";

import { ListaNoDisponible, ListaObras } from "./lista-obras";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

const OBRAS: Obra[] = [
  { tmdbId: 603, tipo: "pelicula", titulo: "Matrix", fechaEstreno: "1999-03-31", poster: "https://image.tmdb.org/t/p/w500/m.jpg", posterGradient: "" },
  { tmdbId: 1399, tipo: "serie", titulo: "Juego de tronos", fechaEstreno: "2011-04-17", posterGradient: "" },
];

describe("ListaObras", () => {
  afterEach(cleanup);

  it("muestra las obras, en qué página está y cómo moverse", () => {
    render(<ListaObras pagina={{ obras: OBRAS, pagina: 2, totalPaginas: 3 }} ruta="/joyas" />);

    expect(screen.getByRole("link", { name: /Matrix/ }).getAttribute("href")).toBe("/content/pelicula/603");
    expect(screen.getByText("Juego de tronos")).toBeTruthy();
    expect(screen.getByText(/Página/).textContent?.replace(/\s+/g, " ")).toBe("Página 2 de 3");
    expect(screen.getByLabelText("Página anterior").getAttribute("href")).toBe("/joyas");
    expect(screen.getByLabelText("Página siguiente").getAttribute("href")).toBe("/joyas?pagina=3");
  });

  it("una página vacía lo dice en lugar de dejar el hueco", () => {
    render(<ListaObras pagina={{ obras: [], pagina: 9, totalPaginas: 9 }} ruta="/tendencias" />);

    expect(screen.getByText("No hay obras en esta página de la lista.")).toBeTruthy();
  });

  it("por defecto explica que la lista no se pudo cargar", () => {
    render(<ListaNoDisponible />);

    expect(screen.getByText(/No pudimos cargar esta lista ahora/)).toBeTruthy();
  });
});
