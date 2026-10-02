import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerPerfilPublico } from "./perfiles";

function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }));
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

function resenaApi(id: string) {
  return {
    id,
    contenido_tmdb_id: 603,
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
  reputacion: 12,
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
      estadisticas: { resenas: 2 },
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

  it("traduce cada reseña y le asigna un degradado según su posición", async () => {
    simularRespuesta(200, PERFIL_API);

    const datos = await obtenerPerfilPublico("anatorres");
    const [primera, segunda] = datos?.resenas ?? [];

    expect(primera).toMatchObject({
      id: "r1",
      titulo: "Película #603",
      puntaje: 4.5,
      fecha: "2026-09-04",
      comentario: "Comentario r1",
    });
    expect(primera.posterGradient).not.toBe(segunda.posterGradient);
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
