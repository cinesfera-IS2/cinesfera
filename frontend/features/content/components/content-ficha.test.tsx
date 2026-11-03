import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { ContentFicha } from "./content-ficha";
import { ResenasProvider } from "./resenas-provider";
import type { ContenidoDetalle } from "../types";


vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  apiFetch: vi.fn(),
}));

const PELICULA: ContenidoDetalle = {
  tmdb_id: 550,
  tipo: "pelicula",
  titulo: "El club de la pelea",
  titulo_original: "Fight Club",
  sinopsis: "Una sinopsis",
  fecha_estreno: "1999-10-15",
  poster_url: null,
  portada_url: null,
  generos: [],
  duracion_minutos: 139,
  cantidad_temporadas: null,
  calificacion_tmdb: 8.4,
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


describe("ContentFicha", () => {
  it("muestra los datos técnicos disponibles", () => {
    render(<ContentFicha contenido={PELICULA} usuario={null} />);

    expect(screen.getByText("15 de octubre de 1999")).toBeTruthy();
    expect(screen.getByText("2 h 19 min")).toBeTruthy();
    expect(screen.getByText("Fight Club")).toBeTruthy();
  });

  it("llama al primer episodio de una serie por su nombre", () => {
    render(
      <ContentFicha
        contenido={{ ...PELICULA, tipo: "serie", duracion_minutos: null, cantidad_temporadas: 2 }}
        usuario={null}
      />
    );

    expect(screen.getByText("Primer episodio")).toBeTruthy();
    expect(screen.getByText("2 temporadas")).toBeTruthy();
    expect(screen.queryByText("Duración")).toBeNull();
  });

  it("invita a iniciar sesión a quien no la tiene", () => {
    render(<ContentFicha contenido={PELICULA} usuario={null} />);

    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")
    ).toBe("/login");
    expect(screen.queryByRole("button", { name: "Escribir una reseña" })).toBeNull();
  });

  it("deja escribir una reseña a quien inició sesión", () => {
    vi.mocked(apiFetch).mockResolvedValue([]);

    render(
      <ResenasProvider tipo="pelicula" tmdbId={550}>
        <ContentFicha contenido={PELICULA} usuario={USUARIO} />
      </ResenasProvider>
    );

    expect(screen.getByRole("button", { name: "Escribir una reseña" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
  });

  it("no muestra avisos sociales ni el formulario a la cuenta administrativa", () => {
    render(
      <ContentFicha
        contenido={PELICULA}
        usuario={{ ...USUARIO, rol: "admin" }}
      />
    );

    expect(
      screen.queryByText(/La cuenta administrativa puede consultar reseñas/)
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Escribir una reseña" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
  });
});
