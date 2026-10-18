import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { buscarObras } from "./catalogo";

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
