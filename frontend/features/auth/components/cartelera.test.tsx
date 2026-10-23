import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { postersDelCatalogo } from "@/features/catalog";

import { Cartelera, CarteleraEsqueleto } from "./cartelera";

vi.mock("@/features/catalog", () => ({ postersDelCatalogo: vi.fn() }));

vi.mock("next/image", () => ({
  default: ({ src }: { src: string }) => <span data-testid="poster" data-src={src} />,
}));

const POSTERS = [
  { tmdbId: 603, titulo: "Matrix", poster: "https://image.tmdb.org/t/p/w500/matrix.jpg" },
  { tmdbId: 550, titulo: "El club de la pelea", poster: "https://image.tmdb.org/t/p/w500/club.jpg" },
];

describe("Cartelera", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(postersDelCatalogo).mockReset();
  });

  it("llena la pared repitiendo los pósters del catálogo", async () => {
    vi.mocked(postersDelCatalogo).mockResolvedValue(POSTERS);

    render(await Cartelera({ variante: "muro" }));

    const posters = screen.getAllByTestId("poster");
    expect(posters).toHaveLength(20);
    expect(posters[0].dataset.src).toBe(POSTERS[0].poster);
    expect(posters[1].dataset.src).toBe(POSTERS[1].poster);
    expect(posters[2].dataset.src).toBe(POSTERS[0].poster);
  });

  it("en la franja muestra una sola fila", async () => {
    vi.mocked(postersDelCatalogo).mockResolvedValue(POSTERS);

    render(await Cartelera({ variante: "franja" }));

    expect(screen.getAllByTestId("poster")).toHaveLength(6);
  });

  it("si el backend falla quedan las siluetas, sin romper la página", async () => {
    vi.mocked(postersDelCatalogo).mockRejectedValue(new Error("Error 500"));

    const { container } = render(await Cartelera({ variante: "muro" }));

    expect(screen.queryAllByTestId("poster")).toHaveLength(0);
    expect(container.querySelectorAll(".aspect-2\\/3")).toHaveLength(20);
  });

  it("el esqueleto dibuja las siluetas de cada variante", () => {
    const { container, rerender } = render(<CarteleraEsqueleto variante="muro" />);
    expect(container.querySelectorAll(".aspect-2\\/3")).toHaveLength(20);

    rerender(<CarteleraEsqueleto variante="franja" />);
    expect(container.querySelectorAll(".aspect-2\\/3")).toHaveLength(6);
  });
});
