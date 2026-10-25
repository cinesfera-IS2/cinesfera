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
  resena_padre_id: null,
  plataforma_id: null,
  calificacion: 4.5,
  valoracion: 2,
  promedio_comunitario: null,
  cantidad_valoraciones: 0,
  autor: {
    id: "usuario-1",
    nombre: "Ana",
    apellido: "Pérez",
    nombre_usuario: "ana",
    foto_url: null,
  },
};

const USUARIO = {
  id: "usuario-1",
  nombre: "Ana",
  apellido: "Pérez",
  nombre_usuario: "ana",
  email: "ana@example.com",
  foto_url: null,
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

    render(<ContentReviews tipo="pelicula" tmdbId={550} usuario={null} />);

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

    render(<ContentReviews tipo="serie" tmdbId={1399} usuario={null} />);

    expect(
      await screen.findByText("Todavía no existen reseñas")
    ).toBeTruthy();
  });

  it("muestra el error y permite volver a intentar", async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error("Backend no disponible"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<ContentReviews tipo="pelicula" tmdbId={550} usuario={null} />);

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


  it("permite leer reseñas sin iniciar sesión, pero no publicar ni responder", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    render(<ContentReviews tipo="pelicula" tmdbId={550} usuario={null} />);

    expect(await screen.findByText("Una película excelente")).toBeTruthy();

    expect(
      screen.queryByRole("button", { name: "Escribir una reseña" })
    ).toBeNull();

    expect(
      screen.queryByRole("button", { name: "Responder" })
    ).toBeNull();
  });

  it("muestra las opciones de publicación y respuesta al usuario autenticado", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    render(
      <ContentReviews
        tipo="pelicula"
        tmdbId={550}
        usuario={USUARIO}
      />
    );

    expect(await screen.findByText("Una película excelente")).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Escribir una reseña" })
    ).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Responder" })
    ).toBeTruthy();
  });

  it("muestra las respuestas anidadas dentro del hilo correspondiente", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "respuesta-1",
        resena_padre_id: "resena-1",
        fecha: "2026-10-16T13:00:00Z",
        texto: "Estoy de acuerdo",
      },
      {
        ...BASE,
        id: "resena-1",
        resena_padre_id: null,
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    const { container } = render(
      <ContentReviews tipo="pelicula" tmdbId={550} usuario={null} />
    );

    expect(await screen.findByText("Estoy de acuerdo")).toBeTruthy();

    const articulos = screen.getAllByRole("article");
    expect(articulos).toHaveLength(2);

    expect(articulos[0].textContent).toContain("Una película excelente");
    expect(articulos[1].textContent).toContain("Estoy de acuerdo");

    const hilo = articulos[1].parentElement;

    expect(hilo).not.toBeNull();
    expect(hilo?.parentElement?.className).toContain("border-l-2");

    expect(container.querySelectorAll("article")).toHaveLength(2);
  });
});
