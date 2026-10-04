import { afterEach, describe, expect, it, vi } from "vitest";

import { cerrarSesion } from "./cerrar-sesion";
import { recargarEn } from "./navegacion";

vi.mock("./navegacion", () => ({ recargarEn: vi.fn() }));

function simularRespuestas(...respuestas: [number, unknown][]) {
  const fetchFalso = vi.fn();
  for (const [status, cuerpo] of respuestas) {
    fetchFalso.mockResolvedValueOnce(
      new Response(JSON.stringify(cuerpo), { status })
    );
  }
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

describe("cerrarSesion", () => {
  afterEach(() => {
    vi.mocked(recargarEn).mockClear();
    vi.unstubAllGlobals();
  });

  it("pide el token CSRF, lo manda al logout y recarga en la portada", async () => {
    const fetchFalso = simularRespuestas(
      [200, { csrf_token: "csrf-prueba" }],
      [200, { mensaje: "Sesión cerrada correctamente" }]
    );

    await cerrarSesion();

    expect(fetchFalso.mock.calls[0][0]).toBe("/api/auth/csrf");
    const [url, opciones] = fetchFalso.mock.calls[1];
    expect(url).toBe("/api/auth/logout");
    expect(opciones.method).toBe("POST");
    expect(opciones.headers["X-CSRF-Token"]).toBe("csrf-prueba");
    expect(recargarEn).toHaveBeenCalledWith("/");
  });

  it("si la sesión ya había vencido, solo recarga", async () => {
    const fetchFalso = simularRespuestas([401, { detail: "No hay una sesión activa" }]);

    await cerrarSesion();

    expect(fetchFalso).toHaveBeenCalledOnce();
    expect(recargarEn).toHaveBeenCalledWith("/");
  });

  it("ante otros errores no recarga y deja que la interfaz avise", async () => {
    simularRespuestas([200, { csrf_token: "csrf-prueba" }], [500, {}]);

    await expect(cerrarSesion()).rejects.toThrow("Error 500");
    expect(recargarEn).not.toHaveBeenCalled();
  });
});
