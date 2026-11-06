import { expect, test, type Page } from "@playwright/test";

import { datosUsuarioNuevo, USUARIO_EXISTENTE, type DatosUsuario } from "../entorno/datos";
import { campo, errorDelServidor } from "../entorno/formularios";

async function completarRegistro(page: Page, cambios: Partial<DatosUsuario> = {}) {
  const datos = { ...datosUsuarioNuevo(), ...cambios };

  await campo(page, "Nombre").fill(datos.nombre);
  await campo(page, "Apellido").fill(datos.apellido);
  await campo(page, "Nombre de usuario").fill(datos.nombre_usuario);
  await campo(page, "Correo electrónico").fill(datos.email);
  await campo(page, "Contraseña").fill(datos.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
}

test.describe("HU1.1 · Registro de usuario", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("1.1.1 con un email ya existente muestra el error y no crea la cuenta", async ({ page }) => {
    await completarRegistro(page, { email: USUARIO_EXISTENTE.email });

    await expect(errorDelServidor(page)).toHaveText("El email ya está registrado");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("1.1.2 con un nombre de usuario ya existente muestra el error y no crea la cuenta", async ({ page }) => {
    await completarRegistro(page, { nombre_usuario: USUARIO_EXISTENTE.nombre_usuario });

    await expect(errorDelServidor(page)).toHaveText("El nombre de usuario ya está registrado");
    await expect(page).toHaveURL(/\/register$/);
  });

  test("1.1.3 con campos obligatorios vacíos marca cuáles faltan y no envía el formulario", async ({ page }) => {
    await completarRegistro(page, { apellido: "", email: "" });

    await expect(campo(page, "Apellido")).toHaveAccessibleDescription("Completá este campo.");
    await expect(campo(page, "Correo electrónico")).toHaveAccessibleDescription("Completá este campo.");
    await expect(campo(page, "Nombre")).not.toHaveAttribute("aria-invalid");
    await expect(errorDelServidor(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/register$/);
  });

  test("1.1.4 con datos no válidos muestra el error de cada campo", async ({ page }) => {
    await completarRegistro(page, {
      nombre_usuario: "ana torres",
      email: "ana@",
      password: "corta",
    });

    await expect(campo(page, "Nombre de usuario")).toHaveAccessibleDescription(
      "Solo minúsculas, números, puntos y guiones bajos."
    );
    await expect(campo(page, "Nombre de usuario")).toHaveAttribute("aria-invalid", "true");
    await expect(campo(page, "Correo electrónico")).toHaveAccessibleDescription(
      "Revisá el correo: tiene que ser algo como nombre@dominio.com."
    );
    await expect(campo(page, "Contraseña")).toHaveAccessibleDescription(
      "Tiene que tener al menos 8 caracteres."
    );
    await expect(page).toHaveURL(/\/register$/);
  });

  test("1.1.4 el nombre de usuario se pasa a minúsculas mientras se escribe", async ({ page }) => {
    await campo(page, "Nombre de usuario").fill("AnaTorres");

    await expect(campo(page, "Nombre de usuario")).toHaveValue("anatorres");
  });

  test("1.1.5 con todos los datos correctos crea la cuenta y entra al catálogo con la sesión iniciada", async ({ page }) => {
    await completarRegistro(page);

    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page.getByRole("button", { name: "Cuenta de Ana" })).toBeVisible();
  });
});
