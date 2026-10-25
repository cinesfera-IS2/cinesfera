import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recargarEn } from "@/features/auth/lib/navegacion";

import { RegisterForm } from "./register-form";

// jsdom no deja reemplazar `window.location`, así que se falsea la recarga.
vi.mock("@/features/auth/lib/navegacion", () => ({ recargarEn: vi.fn() }));

/** Cada respuesta se devuelve en orden: primero el registro, después el login. */
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
    vi.mocked(recargarEn).mockClear();
    vi.unstubAllGlobals();
  });

  it("crea la cuenta, inicia sesión y recarga en el catálogo", async () => {
    const fetchFalso = simularRespuestas([201, { id: "1" }], [200, {}]);

    await completarFormulario();

    expect(fetchFalso).toHaveBeenCalledTimes(2);
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

    const [urlLogin, opcionesLogin] = fetchFalso.mock.calls[1];
    expect(urlLogin).toBe("/api/auth/login");
    expect(JSON.parse(opcionesLogin.body)).toEqual({
      identificador: "ana@example.com",
      password: "ClaveSegura123",
    });
    expect(recargarEn).toHaveBeenCalledWith("/catalogo");
  });

  it("si la cuenta se creó pero el login falla, manda a iniciar sesión", async () => {
    simularRespuestas([201, { id: "1" }], [500, {}]);

    await completarFormulario();

    expect(recargarEn).toHaveBeenCalledWith("/login");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("muestra el error del backend y no navega", async () => {
    const fetchFalso = simularRespuestas([
      409,
      { detail: "El email ya está registrado" },
    ]);

    await completarFormulario();

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("El email ya está registrado");
    expect(recargarEn).not.toHaveBeenCalled();
    expect(fetchFalso).toHaveBeenCalledOnce();
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

  it("sin completar no envía y marca cada campo que falta", async () => {
    const fetchFalso = simularRespuestas([201, {}]);

    await userEvent.setup().click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(fetchFalso).not.toHaveBeenCalled();
    expect(screen.getAllByText("Completá este campo.")).toHaveLength(5);
    expect(document.activeElement).toBe(screen.getByLabelText("Nombre"));
  });

  it("explica el error al salir del campo y lo saca apenas se corrige", async () => {
    const usuario = userEvent.setup();
    const email = screen.getByLabelText("Correo electrónico");

    await usuario.type(email, "ana@");
    await usuario.tab();
    expect(screen.getByText(/Revisá el correo/)).toBeTruthy();
    expect(email.getAttribute("aria-invalid")).toBe("true");

    await usuario.type(email, "example.com");
    expect(screen.queryByText(/Revisá el correo/)).toBeNull();
    expect(email.getAttribute("aria-invalid")).toBeNull();
  });

  it("el usuario con caracteres no permitidos muestra la regla", async () => {
    const usuario = userEvent.setup();

    await usuario.type(screen.getByLabelText("Nombre de usuario"), "ana torres");
    await usuario.tab();

    expect(
      screen.getAllByText("Solo minúsculas, números, puntos y guiones bajos.")
    ).toHaveLength(1);
    expect(
      screen.getByLabelText("Nombre de usuario").getAttribute("aria-invalid")
    ).toBe("true");
  });

  it("el medidor de la contraseña aparece recién al escribirla", async () => {
    expect(screen.queryByText("Al menos un número")).toBeNull();

    await userEvent.setup().type(screen.getByLabelText("Contraseña"), "clave");

    expect(screen.getByText("Al menos un número")).toBeTruthy();
  });

  it("mientras crea la cuenta bloquea el formulario", async () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    await completarFormulario();

    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Creando cuenta..." }).disabled
    ).toBe(true);
    // El fieldset deshabilita a todos sus campos, aunque ellos no tengan el atributo.
    expect(screen.getByLabelText("Nombre").matches(":disabled")).toBe(true);
  });
});
