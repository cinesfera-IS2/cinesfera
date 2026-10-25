import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerListaSeguimientos, obtenerPerfilPublico } from "./perfiles";

const CONTENIDO_API = {
  tmdb_id: 603,
  tipo: "pelicula",
  titulo: "Matrix",
  titulo_original: "The Matrix",
  sinopsis: "Una hacker descubre la verdad.",
  fecha_estreno: "1999-03-30",
  poster_url: "https://image.tmdb.org/t/p/w500/matrix.jpg",
  portada_url: null,
  generos: [{ id: 878, nombre: "Ciencia ficción" }],
  duracion_minutos: 136,
  cantidad_temporadas: null,
  calificacion_tmdb: 8.2,
};

function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi
    .fn()
    .mockImplementation(async (entrada: string | URL | Request) => {
      const url = String(entrada);
      const esContenido = /\/contenidos\/(pelicula|serie)\/\d+$/.test(url);
      return new Response(
        JSON.stringify(esContenido ? CONTENIDO_API : cuerpo),
        { status: esContenido ? 200 : status }
      );
    });
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

function resenaApi(id: string) {
  return {
    id,
    contenido_tmdb_id: 603,
    contenido_tipo: "pelicula",
    contenido_titulo: "Matrix",
    plataforma_id: null,
    calificacion: 4.5,
    texto: `Comentario ${id}`,
    fecha: "2026-09-04T18:30:00-03:00",
  };
}

const PERFIL_API = {
  id: "u1",
  nombre: "Ana",
  apellido: "Torres",
  nombre_usuario: "anatorres",
  foto_url: null,
  bio: "Fan del cine independiente",
  ubicacion: "Montevideo, Uruguay",
  generos_favoritos: ["Drama", "Comedia"],
  rol: "usuario",
  fecha_registro: "2026-02-14T12:00:00Z",
  reputacion: 12,
  seguidores: 8,
  siguiendo: 3,
  resenas: [resenaApi("r1"), resenaApi("r2")],
};

describe("obtenerPerfilPublico", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pide el perfil por nombre de usuario, escapándolo en la URL", async () => {
    const fetchFalso = simularRespuesta(200, PERFIL_API);

    await obtenerPerfilPublico("ana torres");

    expect(fetchFalso.mock.calls[0][0]).toMatch(
      /\/usuarios\/por-nombre\/ana%20torres\/perfil-publico$/
    );
    expect(fetchFalso.mock.calls[0][1]).toMatchObject({ cache: "no-store" });
  });

  it("traduce el perfil de la API al formato de la pantalla", async () => {
    simularRespuesta(200, PERFIL_API);

    const datos = await obtenerPerfilPublico("anatorres");

    expect(datos?.perfil).toMatchObject({
      id: "u1",
      nombreUsuario: "anatorres",
      nombre: "Ana",
      apellido: "Torres",
      fotoUrl: undefined,
      bio: "Fan del cine independiente",
      ubicacion: "Montevideo, Uruguay",
      generosFavoritos: ["Drama", "Comedia"],
      rol: "usuario",
      fechaRegistro: "2026-02-14",
      estadisticas: { resenas: 2, seguidores: 8, siguiendo: 3 },
    });
  });

  it("conserva la foto cuando la API la manda", async () => {
    simularRespuesta(200, {
      ...PERFIL_API,
      foto_url: "https://example.com/ana.jpg",
    });

    const datos = await obtenerPerfilPublico("anatorres");

    expect(datos?.perfil.fotoUrl).toBe("https://example.com/ana.jpg");
  });

  it("completa las reseñas con título, año, póster y enlace al contenido", async () => {
    const fetchFalso = simularRespuesta(200, PERFIL_API);

    const datos = await obtenerPerfilPublico("anatorres");
    const [primera, segunda] = datos?.resenas ?? [];

    expect(primera).toMatchObject({
      id: "r1",
      titulo: "Matrix",
      anio: 1999,
      puntaje: 4.5,
      fecha: "2026-09-04",
      comentario: "Comentario r1",
      posterUrl: "https://image.tmdb.org/t/p/w500/matrix.jpg",
      href: "/content/pelicula/603#resena-r1",
    });
    expect(primera.posterGradient).not.toBe(segunda.posterGradient);
    expect(
      fetchFalso.mock.calls.filter(([url]) =>
        String(url).endsWith("/contenidos/pelicula/603")
      )
    ).toHaveLength(1);
  });

  it("devuelve null si el usuario no existe", async () => {
    simularRespuesta(404, { detail: "Usuario no encontrado" });

    expect(await obtenerPerfilPublico("nadie")).toBeNull();
  });

  it("propaga los demás errores del backend", async () => {
    simularRespuesta(500, { detail: "Se rompió" });

    await expect(obtenerPerfilPublico("anatorres")).rejects.toThrow("Se rompió");
  });
});

describe("obtenerListaSeguimientos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pide la lista indicada y adapta los nombres de sus campos", async () => {
    const fetchFalso = simularRespuesta(200, [
      {
        id: "u2",
        nombre: "Bruno",
        apellido: "Díaz",
        nombre_usuario: "brunod",
        foto_url: null,
      },
    ]);

    const usuarios = await obtenerListaSeguimientos("u1", "seguidores");

    expect(fetchFalso.mock.calls[0][0]).toMatch(
      /\/usuarios\/u1\/seguidores$/
    );
    expect(usuarios).toEqual([
      {
        id: "u2",
        nombre: "Bruno",
        apellido: "Díaz",
        nombreUsuario: "brunod",
        fotoUrl: undefined,
      },
    ]);
  });
});
