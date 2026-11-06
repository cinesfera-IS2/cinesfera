import { expect, test, type Page } from "@playwright/test";

import {
  crearUsuario,
  datosUsuarioNuevo,
  suspenderUsuario,
  USUARIO_EXISTENTE,
} from "../entorno/datos";
import { campo, errorDelServidor } from "../entorno/formularios";

const FICHA = "/content/pelicula/550"; // El club de la pelea

async function completarLogin(page: Page, identificador: string, password: string) {
  await campo(page, "Correo o nombre de usuario").fill(identificador);
  await campo(page, "Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

/** Pregunta al backend, con las cookies del navegador, si hay una sesión abierta. */
async function haySesion(page: Page) {
  const respuesta = await page.request.get("/api/auth/me");
  return respuesta.ok();
}

test.describe("HU1.2 · Inicio de sesión", () => {
  test("1.2.1 con credenciales incorrectas muestra el error y sigue sin sesión", async ({ page }) => {
    await page.goto("/login");

    await completarLogin(page, USUARIO_EXISTENTE.email, "Contraseña-Incorrecta-1");

    await expect(errorDelServidor(page)).toHaveText("Credenciales inválidas");
    await expect(page).toHaveURL(/\/login$/);
    expect(await haySesion(page)).toBe(false);
  });

  test("1.2.2 con credenciales correctas entra al catálogo por defecto", async ({ page }) => {
    await page.goto("/login");

    await completarLogin(page, USUARIO_EXISTENTE.nombre_usuario, USUARIO_EXISTENTE.password);

    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(
      page.getByRole("button", { name: `Cuenta de ${USUARIO_EXISTENTE.nombre}` })
    ).toBeVisible();
  });

  test("1.2.3 al entrar desde una ficha vuelve a esa misma ficha", async ({ page }) => {
    await page.goto(FICHA);

    await page.getByRole("link", { name: "Iniciar sesión", exact: true }).click();
    await expect(page).toHaveURL(/\/login\?/);

    await completarLogin(page, USUARIO_EXISTENTE.email, USUARIO_EXISTENTE.password);

    await expect(page).toHaveURL(new RegExp(`${FICHA}$`));
    await expect(page.getByRole("button", { name: "Escribir una reseña" })).toBeVisible();
  });

  test("1.2.4 con una cuenta suspendida no entra y ve el aviso", async ({ page }) => {
    const suspendido = datosUsuarioNuevo();
    const id = await crearUsuario(suspendido);
    await suspenderUsuario(id!);

    await page.goto("/login");
    await completarLogin(page, suspendido.email, suspendido.password);

    await expect(errorDelServidor(page)).toHaveText("Tu cuenta ha sido suspendida");
    await expect(page).toHaveURL(/\/login$/);
    expect(await haySesion(page)).toBe(false);
  });

  test("1.2.5 al cerrar sesión vuelve a aparecer Acceder y la ficha ya no ofrece reseñar", async ({ page }) => {
    // El login por formulario ya se prueba arriba: acá se entra directo por la API.
    const login = await page.request.post("/api/auth/login", {
      data: { identificador: USUARIO_EXISTENTE.email, password: USUARIO_EXISTENTE.password },
    });
    expect(login.ok()).toBe(true);

    await page.goto(FICHA);
    await expect(page.getByRole("button", { name: "Escribir una reseña" })).toBeVisible();

    await page.getByRole("button", { name: `Cuenta de ${USUARIO_EXISTENTE.nombre}` }).click();
    await page.getByRole("button", { name: "Cerrar sesión" }).filter({ visible: true }).click();

    // El primero es el del encabezado; el menú móvil tiene otro.
    await expect(page.getByRole("link", { name: "Acceder" }).first()).toBeVisible();
    expect(await haySesion(page)).toBe(false);

    await page.goto(FICHA);
    await expect(page.getByRole("link", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escribir una reseña" })).toHaveCount(0);
  });
});
