import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ContenidoDetalle } from "@/features/content";
import ContentPage, { generateMetadata } from "./page";


const { obtenerContenidoMock, notFoundMock } = vi.hoisted(() => ({
  obtenerContenidoMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/content", () => ({
  obtenerContenido: obtenerContenidoMock,
  ContentHero: ({ contenido }: { contenido: ContenidoDetalle }) => (
    <div>Hero: {contenido.titulo}</div>
  ),
  ContentReviews: ({ tmdbId }: { tmdbId: number }) => (
    <div>Reseñas: {tmdbId}</div>
  ),
}));

vi.mock("@/features/landing", () => ({
  LandingHeader: () => <header>Cabecera</header>,
  LandingFooter: () => <footer>Pie</footer>,
}));

vi.mock("next/navigation", () => ({ notFound: notFoundMock }));

const CONTENIDO: ContenidoDetalle = {
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


afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});


describe("página de contenido", () => {
  it("genera metadata con los datos del contenido", async () => {
    obtenerContenidoMock.mockResolvedValue(CONTENIDO);

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "pelicula", id: "550" }),
    } as PageProps<"/content/[type]/[id]">);

    expect(metadata).toMatchObject({
      title: "El club de la pelea — Cinesfera",
      description: "Una sinopsis",
    });
  });

  it("usa una descripción de respaldo cuando falta la sinopsis", async () => {
    obtenerContenidoMock.mockResolvedValue({ ...CONTENIDO, sinopsis: "" });

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "serie", id: "550" }),
    } as PageProps<"/content/[type]/[id]">);

    expect(metadata.description).toContain("Ficha, puntuación y reseñas");
  });

  it.each([
    { type: "documental", id: "550" },
    { type: "pelicula", id: "abc" },
    { type: "pelicula", id: "0" },
  ])("rechaza parámetros inválidos: $type/$id", async (params) => {
    const metadata = await generateMetadata({
      params: Promise.resolve(params),
    } as PageProps<"/content/[type]/[id]">);

    expect(metadata.title).toBe("Contenido no encontrado — Cinesfera");
    expect(obtenerContenidoMock).not.toHaveBeenCalled();
  });

  it("devuelve metadata 404 si el backend no encuentra el contenido", async () => {
    obtenerContenidoMock.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ type: "serie", id: "1399" }),
    } as PageProps<"/content/[type]/[id]">);

    expect(metadata.title).toBe("Contenido no encontrado — Cinesfera");
  });

  it("renderiza la ficha y sus reseñas", async () => {
    obtenerContenidoMock.mockResolvedValue(CONTENIDO);

    render(
      await ContentPage({
        params: Promise.resolve({ type: "pelicula", id: "550" }),
      } as PageProps<"/content/[type]/[id]">)
    );

    expect(screen.getByText("Hero: El club de la pelea")).toBeTruthy();
    expect(screen.getByText("Reseñas: 550")).toBeTruthy();
  });

  it("activa notFound para una ficha inexistente", async () => {
    obtenerContenidoMock.mockResolvedValue(null);

    await expect(
      ContentPage({
        params: Promise.resolve({ type: "serie", id: "1399" }),
      } as PageProps<"/content/[type]/[id]">)
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
