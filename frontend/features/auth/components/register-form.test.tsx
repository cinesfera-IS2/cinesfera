import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "./register-form";

// El formulario navega con el router de Next, que no existe fuera de la app.
// Se reemplaza por uno falso para poder comprobar a dónde quiso ir.
const router = { replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

function simularRespuesta(status: number, cuerpo: unknown) {
  const fetchFalso = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }));
  vi.stubGlobal("fetch", fetchFalso);
  return fetchFalso;
}

async function completarFormulario() {
  const usuario = userEvent.setup();

  await usuario.type(screen.getByLabelText("Nombre"), "Ana");
  await usuario.type(screen.getByLabelText("Apellido"), "Torres");
  await usuario.type(screen.getByLabelText("Nombre de usuario"), "AnaTorres");
  await usuario.type(
    screen.getByLabelText("Correo electrónico"),
    "ana@example.com"
  );
  await usuario.type(screen.getByLabelText("Contraseña"), "ClaveSegura123");
  await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));
}

describe("RegisterForm", () => {
  beforeEach(() => {
    render(<RegisterForm />);
  });

  afterEach(() => {
    cleanup();
    router.replace.mockClear();
    vi.unstubAllGlobals();
  });

  it("envía los datos a /auth/register y vuelve a la portada", async () => {
    const fetchFalso = simularRespuesta(201, { id: "1" });

    await completarFormulario();

    expect(fetchFalso).toHaveBeenCalledOnce();
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toMatch(/\/auth\/register$/);
    expect(opciones.method).toBe("POST");
    expect(JSON.parse(opciones.body)).toEqual({
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      password: "ClaveSegura123",
    });
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("muestra el error del backend y no navega", async () => {
    simularRespuesta(409, { detail: "El email ya está registrado" });

    await completarFormulario();

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("El email ya está registrado");
    expect(router.replace).not.toHaveBeenCalled();
    const boton = screen.getByRole<HTMLButtonElement>("button", {
      name: "Crear cuenta",
    });
    expect(boton.disabled).toBe(false);
  });

  it("avisa si no se pudo conectar con el servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError()));

    await completarFormulario();

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("No pudimos conectar con el servidor");
  });
});
