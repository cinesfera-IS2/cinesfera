import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerSesion } from "./session";

const cookieFalsa = vi.fn();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieFalsa }),
}));

// `cache` de React solo memoiza dentro de un request de Next; acá se anula
// para que cada test resuelva la sesión desde cero.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  cache: <T>(fn: T) => fn,
}));

function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }));
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

describe("obtenerSesion", () => {
  afterEach(() => {
    cookieFalsa.mockReset();
    vi.unstubAllGlobals();
  });

  it("sin cookie no consulta al backend", async () => {
    const fetchFalso = simularRespuesta(200, {});
    cookieFalsa.mockReturnValue(undefined);

    expect(await obtenerSesion()).toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("reenvía la cookie a /auth/me y devuelve el usuario", async () => {
    const usuario = { id: "u1", nombre_usuario: "anatorres" };
    const fetchFalso = simularRespuesta(200, usuario);
    cookieFalsa.mockReturnValue({ value: "token-prueba" });

    expect(await obtenerSesion()).toEqual(usuario);

    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toMatch(/\/auth\/me$/);
    expect(opciones.headers.Cookie).toBe("access_token=token-prueba");
    expect(opciones.cache).toBe("no-store");
  });

  it("con el token vencido se navega como visitante", async () => {
    simularRespuesta(401, { detail: "Token inválido o expirado" });
    cookieFalsa.mockReturnValue({ value: "token-vencido" });

    expect(await obtenerSesion()).toBeNull();
  });

  it("si el backend falla, navega como visitante y deja registro", async () => {
    const consola = vi.spyOn(console, "error").mockImplementation(() => {});
    simularRespuesta(500, {});
    cookieFalsa.mockReturnValue({ value: "token-prueba" });

    expect(await obtenerSesion()).toBeNull();
    expect(consola).toHaveBeenCalledOnce();
    consola.mockRestore();
  });
});
