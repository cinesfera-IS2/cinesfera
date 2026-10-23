import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentHero } from "./content-hero";
import type { ContenidoDetalle } from "../types";


vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span role="img" aria-label={alt || "portada"} data-src={src} />
  ),
}));


const PELICULA: ContenidoDetalle = {
  tmdb_id: 550,
  tipo: "pelicula",
  titulo: "El club de la pelea",
  titulo_original: "Fight Club",
  sinopsis: "Una sinopsis de prueba.",
  fecha_estreno: "1999-10-15",
  poster_url: "https://image.tmdb.org/t/p/w500/poster.jpg",
  portada_url: "https://image.tmdb.org/t/p/original/portada.jpg",
  generos: [{ id: 18, nombre: "Drama" }],
  duracion_minutos: 139,
  cantidad_temporadas: null,
  calificacion_tmdb: 8.4,
};


afterEach(cleanup);


describe("ContentHero", () => {
  it("muestra todos los datos disponibles de una película", () => {
    render(<ContentHero contenido={PELICULA} />);

    expect(screen.getByRole("heading", { name: PELICULA.titulo })).toBeTruthy();
    expect(screen.getByText("Fight Club")).toBeTruthy();
    expect(screen.getByText("Película")).toBeTruthy();
    expect(screen.getByText("1999")).toBeTruthy();
    expect(screen.getByText("2 h 19 min")).toBeTruthy();
    expect(screen.getByText("Drama")).toBeTruthy();
    // La portada de fondo es decorativa: solo el póster llega al lector de pantalla.
    expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(2);
    expect(screen.getByRole("img").getAttribute("aria-label")).toBe(
      `Póster de ${PELICULA.titulo}`
    );
  });

  it("no muestra el puntaje de TMDB: las reseñas son de la comunidad", () => {
    render(<ContentHero contenido={PELICULA} />);

    expect(screen.queryByText("TMDB")).toBeNull();
    expect(screen.queryByText("8.4")).toBeNull();
  });

  it("lleva de vuelta al catálogo", () => {
    render(<ContentHero contenido={PELICULA} />);

    expect(
      screen.getByRole("link", { name: "Catálogo" }).getAttribute("href")
    ).toBe("/catalogo");
  });

  it("no repite el título original cuando coincide con el traducido", () => {
    render(
      <ContentHero
        contenido={{ ...PELICULA, titulo: "Fight Club", titulo_original: "fight club" }}
      />
    );

    expect(screen.getAllByText(/fight club/i)).toHaveLength(1);
  });

  it("usa el póster como fondo cuando no hay portada", () => {
    render(<ContentHero contenido={{ ...PELICULA, portada_url: null }} />);

    const imagenes = screen.getAllByRole("img", { hidden: true });
    expect(imagenes).toHaveLength(2);
    expect(
      imagenes.every((imagen) => imagen.getAttribute("data-src") === PELICULA.poster_url)
    ).toBe(true);
  });

  it("muestra los respaldos y el singular de una serie sin imágenes", () => {
    render(
      <ContentHero
        contenido={{
          ...PELICULA,
          tipo: "serie",
          titulo: "Serie de prueba",
          fecha_estreno: null,
          poster_url: null,
          portada_url: null,
          generos: [],
          duracion_minutos: null,
          cantidad_temporadas: 1,
          sinopsis: "",
        }}
      />
    );

    expect(screen.getByText("Serie")).toBeTruthy();
    expect(screen.getByText("1 temporada")).toBeTruthy();
    expect(screen.getByText("Portada no disponible")).toBeTruthy();
    expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  });

  it("usa el plural cuando una serie tiene varias temporadas", () => {
    render(
      <ContentHero
        contenido={{ ...PELICULA, tipo: "serie", cantidad_temporadas: 3 }}
      />
    );

    expect(screen.getByText("3 temporadas")).toBeTruthy();
  });
});
