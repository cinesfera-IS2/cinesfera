import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch, apiUrl } from "./api";

/**
 * En lugar de llamar al backend de verdad, se reemplaza `fetch` por una función
 * falsa que devuelve la respuesta que cada test necesita.
 */
function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi.fn().mockResolvedValue(
    new Response(
      typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
      { status }
    )
  );
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiUrl", () => {
  it("agrega la barra inicial si falta", () => {
    expect(apiUrl("auth/login")).toBe(apiUrl("/auth/login"));
    expect(apiUrl("/auth/login")).toMatch(/[^/]\/auth\/login$/);
  });

  it("en el navegador pasa por el proxy /api de Next", () => {
    expect(apiUrl("/auth/login")).toBe("/api/auth/login");
  });

  it("en el servidor apunta directo al backend", () => {
    vi.stubGlobal("window", undefined);

    expect(apiUrl("/auth/login")).toMatch(/^https?:\/\/.+\/auth\/login$/);
  });
});

describe("apiFetch", () => {
  it("devuelve el JSON de una respuesta exitosa y manda Content-Type", async () => {
    const fetchFalso = simularRespuesta(200, { id: 1 });

    const resultado = await apiFetch("/auth/me", {
      headers: { Authorization: "Bearer token" },
    });

    expect(resultado).toEqual({ id: 1 });
    const [, opciones] = fetchFalso.mock.calls[0];
    expect(opciones.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    });
  });

  it("usa el detail del backend como mensaje de error", async () => {
    simularRespuesta(409, { detail: "El email ya está registrado" });

    const error = await apiFetch("/auth/register").catch((e: ApiError) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      message: "El email ya está registrado",
    });
  });

  it("junta los mensajes de validación de un 422", async () => {
    simularRespuesta(422, {
      detail: [{ msg: "Email inválido" }, { msg: "Contraseña muy corta" }],
    });

    await expect(apiFetch("/auth/register")).rejects.toThrow(
      "Email inválido. Contraseña muy corta"
    );
  });

  it("si el cuerpo no es JSON, informa el código de estado", async () => {
    simularRespuesta(500, "Internal Server Error");

    await expect(apiFetch("/auth/register")).rejects.toThrow("Error 500");
  });
});
