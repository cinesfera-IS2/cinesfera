import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import {
  buscarObras,
  obrasDestacadas,
  obrasEnTendencia,
  postersDelCatalogo,
} from "./catalogo";

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, apiFetch: vi.fn() };
});

const apiFetchMock = vi.mocked(apiFetch);

const RESPUESTA = {
  contents: [
    {
      title: "Matrix",
      content_type: "movie",
      release_date: "1999-03-31",
      summary: "Resumen",
      poster_url: "https://image.tmdb.org/t/p/w500/matrix.jpg",
      tmdb_id: 603,
    },
    {
      title: "Dark",
      content_type: "series",
      release_date: "",
      summary: null,
      poster_url: null,
      tmdb_id: 70523,
    },
  ],
  total_pages: 500,
};

afterEach(() => vi.clearAllMocks());

describe("buscarObras", () => {
  it("pide la página al backend y adapta los contenidos a obras", async () => {
    apiFetchMock.mockResolvedValue(RESPUESTA);

    const resultado = await buscarObras({ orden: "populares", pagina: 3 });

    expect(apiFetchMock).toHaveBeenCalledWith("/catalogue/?page=3", {
      cache: "no-store",
    });
    expect(resultado).toMatchObject({ pagina: 3, totalPaginas: 500 });
    expect(resultado.obras).toMatchObject([
      {
        tmdbId: 603,
        tipo: "pelicula",
        titulo: "Matrix",
        fechaEstreno: "1999-03-31",
        poster: "https://image.tmdb.org/t/p/w500/matrix.jpg",
      },
      { tmdbId: 70523, tipo: "serie", fechaEstreno: null, poster: undefined },
    ]);
  });

  it("traduce la búsqueda, el tipo y el año a los parámetros del backend", async () => {
    apiFetchMock.mockResolvedValue(RESPUESTA);

    await buscarObras({
      orden: "populares",
      pagina: 1,
      texto: "dark",
      tipo: "serie",
      anioEstreno: 2017,
      genero: "drama",
    });

    expect(apiFetchMock.mock.calls[0][0]).toBe(
      "/catalogue/?page=1&search=dark&content_type=series&year=2017"
    );
  });
});

describe("postersDelCatalogo", () => {
  it("devuelve solo las obras con póster y cachea la respuesta una hora", async () => {
    apiFetchMock.mockResolvedValue(RESPUESTA);

    const posters = await postersDelCatalogo();

    expect(apiFetchMock).toHaveBeenCalledWith("/catalogue/?page=1", {
      next: { revalidate: 3600 },
    });
    expect(posters).toEqual([
      {
        tmdbId: 603,
        titulo: "Matrix",
        poster: "https://image.tmdb.org/t/p/w500/matrix.jpg",
      },
    ]);
  });
});

describe("listas de la portada", () => {
  it("las joyas piden la página al backend y se cachean una hora", async () => {
    apiFetchMock.mockResolvedValue(RESPUESTA);

    const resultado = await obrasDestacadas(2);

    expect(apiFetchMock).toHaveBeenCalledWith("/catalogue/highlights?page=2", {
      next: { revalidate: 3600 },
    });
    expect(resultado).toMatchObject({ pagina: 2, totalPaginas: 500 });
    expect(resultado.obras.map((obra) => obra.titulo)).toEqual(["Matrix", "Dark"]);
  });

  it("las tendencias arrancan por la primera página", async () => {
    apiFetchMock.mockResolvedValue(RESPUESTA);

    const resultado = await obrasEnTendencia();

    expect(apiFetchMock).toHaveBeenCalledWith("/catalogue/trending?page=1", {
      next: { revalidate: 3600 },
    });
    expect(resultado.obras[1]).toMatchObject({ tipo: "serie", tmdbId: 70523 });
  });
});
