import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { ContentReviews } from "./content-reviews";
import type { ResenaContenido } from "../types";


vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));


const apiFetchMock = vi.mocked(apiFetch);

const BASE: Omit<ResenaContenido, "id" | "fecha" | "texto"> = {
  contenido_tmdb_id: 550,
  plataforma_id: null,
  calificacion: 4.5,
  valoracion: 2,
  autor: {
    id: "usuario-1",
    nombre: "Ana",
    apellido: "Pérez",
    nombre_usuario: "ana",
    foto_url: null,
  },
};


afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});


describe("ContentReviews", () => {
  it("muestra las reseñas en orden cronológico descendente", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "antigua",
        fecha: "2026-08-01T12:00:00Z",
        texto: "Reseña antigua",
      },
      {
        ...BASE,
        id: "reciente",
        fecha: "2026-09-01T12:00:00Z",
        texto: "Reseña reciente",
      },
    ]);

    render(<ContentReviews tipo="pelicula" tmdbId={550} />);

    const articulos = await screen.findAllByRole("article");
    expect(articulos).toHaveLength(2);
    expect(articulos[0].textContent).toContain("Reseña reciente");
    expect(articulos[1].textContent).toContain("Reseña antigua");
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/contenidos/pelicula/550/resenas",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("informa cuando todavía no existen reseñas", async () => {
    apiFetchMock.mockResolvedValue([]);

    render(<ContentReviews tipo="serie" tmdbId={1399} />);

    expect(
      await screen.findByText("Todavía no existen reseñas")
    ).toBeTruthy();
  });

  it("muestra el error y permite volver a intentar", async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error("Backend no disponible"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<ContentReviews tipo="pelicula" tmdbId={550} />);

    expect(
      await screen.findByText("No pudimos cargar las reseñas")
    ).toBeTruthy();
    expect(screen.getByText("Backend no disponible")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("Todavía no existen reseñas")
    ).toBeTruthy();
  });
});
