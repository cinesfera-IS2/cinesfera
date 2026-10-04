import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recargarEn } from "@/features/auth/lib/navegacion";

import { LoginForm } from "./login-form";

// jsdom no deja reemplazar `window.location`, así que se falsea la recarga.
vi.mock("@/features/auth/lib/navegacion", () => ({ recargarEn: vi.fn() }));

function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }));
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

async function completarFormulario() {
  const usuario = userEvent.setup();

  await usuario.type(
    screen.getByLabelText("Correo o nombre de usuario"),
    "ana@example.com"
  );
  await usuario.type(screen.getByLabelText("Contraseña"), "ClaveSegura123");
  await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    render(<LoginForm />);
  });

  afterEach(() => {
    cleanup();
    vi.mocked(recargarEn).mockClear();
    vi.unstubAllGlobals();
  });

  it("envía las credenciales a /auth/login y recarga en la portada", async () => {
    const fetchFalso = simularRespuesta(200, {
      mensaje: "Sesion iniciada correctamente",
    });

    await completarFormulario();

    expect(fetchFalso).toHaveBeenCalledOnce();
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(opciones.body)).toEqual({
      identificador: "ana@example.com",
      password: "ClaveSegura123",
    });
    expect(recargarEn).toHaveBeenCalledWith("/");
  });

  it("deja el botón deshabilitado mientras inicia sesión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    await completarFormulario();

    const boton = screen.getByRole<HTMLButtonElement>("button", {
      name: "Ingresando...",
    });
    expect(boton.disabled).toBe(true);
  });

  it("muestra el error del backend y no navega", async () => {
    simularRespuesta(401, { detail: "Credenciales inválidas" });

    await completarFormulario();

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("Credenciales inválidas");
    expect(recargarEn).not.toHaveBeenCalled();
    const boton = screen.getByRole<HTMLButtonElement>("button", {
      name: "Iniciar sesión",
    });
    expect(boton.disabled).toBe(false);
  });

  it("avisa si no se pudo conectar con el servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError()));

    await completarFormulario();

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("No pudimos conectar con el servidor");
  });

  it("permite mostrar la contraseña", async () => {
    const usuario = userEvent.setup();
    const campo = screen.getByLabelText<HTMLInputElement>("Contraseña");

    await usuario.click(
      screen.getByRole("button", { name: "Mostrar contraseña" })
    );

    expect(campo.type).toBe("text");
  });
});
