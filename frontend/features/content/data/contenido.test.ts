import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "@/lib/api";
import { obtenerContenido } from "./contenido";
import type { ContenidoDetalle } from "../types";


vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, apiFetch: vi.fn() };
});


const apiFetchMock = vi.mocked(apiFetch);

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


afterEach(() => vi.clearAllMocks());


describe("obtenerContenido", () => {
  it("consulta el endpoint de la ficha sin usar cache HTTP", async () => {
    apiFetchMock.mockResolvedValue(CONTENIDO);

    await expect(obtenerContenido("pelicula", 550)).resolves.toEqual(CONTENIDO);
    expect(apiFetchMock).toHaveBeenCalledWith("/contenidos/pelicula/550", {
      cache: "no-store",
    });
  });

  it("devuelve null cuando el contenido no existe", async () => {
    apiFetchMock.mockRejectedValue(new ApiError(404, "No encontrado"));

    await expect(obtenerContenido("serie", 999999)).resolves.toBeNull();
  });

  it("propaga errores distintos de 404", async () => {
    apiFetchMock.mockRejectedValue(new ApiError(502, "Catálogo no disponible"));

    await expect(obtenerContenido("pelicula", 550)).rejects.toThrow(
      "Catálogo no disponible"
    );
  });
});
