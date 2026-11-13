import { expect, test } from "@playwright/test";

import {
  ADMINISTRADOR_E2E,
  crearUsuarioNuevo,
  iniciarSesion,
  iniciarSesionAdministrador,
  publicarResena,
  USUARIO_EXISTENTE,
} from "../entorno/datos";
import { campo, errorDelServidor } from "../entorno/formularios";

const FICHA = "/content/pelicula/550"; // El club de la pelea

test.describe("HU1.7 · Administración de usuarios", () => {
  test("1.7.1 un administrador ingresa al panel después de iniciar sesión", async ({ page }) => {
    await page.goto("/login");

    await campo(page, "Correo o nombre de usuario").fill(
      ADMINISTRADOR_E2E.nombre_usuario
    );
    await campo(page, "Contraseña").fill(ADMINISTRADOR_E2E.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(
      page.getByRole("heading", { name: "Panel de administración", level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Administrador principal", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Resumen" })).toBeVisible();
  });

  test("1.7.2 un usuario común no accede al panel de administración", async ({ page }) => {
    await iniciarSesion(page, USUARIO_EXISTENTE);

    await page.goto("/admin");

    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(page.getByRole("heading", { name: "Catálogo", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Panel de administración", level: 1 })
    ).toHaveCount(0);
  });

  test("1.7.3 al suspender una cuenta sus reseñas dejan de verse en la ficha", async ({ page }) => {
    const usuario = await crearUsuarioNuevo();
    const textoResena = `Reseña previa a la suspensión de ${usuario.nombre_usuario}`;
    await publicarResena(usuario, {
      tipo: "pelicula",
      tmdbId: 550,
      texto: textoResena,
      calificacion: 4,
    });

    await page.goto(FICHA);
    await expect(page.getByText(textoResena, { exact: true })).toBeVisible();

    await iniciarSesionAdministrador(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: "Usuarios", exact: true }).click();

    const filaUsuario = page
      .getByRole("row")
      .filter({ hasText: `@${usuario.nombre_usuario}` });
    await expect(filaUsuario).toBeVisible();
    await filaUsuario.getByRole("button", { name: "Suspender" }).click();

    const dialogo = page.getByRole("dialog", { name: "Suspender cuenta" });
    await dialogo.getByRole("textbox", { name: "Motivo" }).fill(
      "La cuenta incumplió las normas de la comunidad"
    );
    await dialogo.getByRole("radio", { name: "indefinida" }).check();
    await dialogo.getByRole("button", { name: "Confirmar suspensión" }).click();

    await expect(dialogo).toHaveCount(0);
    await expect(filaUsuario).toContainText("suspendido");

    await page.goto(FICHA);
    await expect(page.getByText(textoResena, { exact: true })).toHaveCount(0);
  });

  test("1.7.4 al eliminar una cuenta su perfil desaparece y ya no puede iniciar sesión", async ({ page }) => {
    const usuario = await crearUsuarioNuevo({
      nombre: "Cuenta",
      apellido: "A eliminar",
    });

    await page.goto(`/profile/${usuario.nombre_usuario}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      `${usuario.nombre} ${usuario.apellido}`
    );

    await iniciarSesionAdministrador(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: "Usuarios", exact: true }).click();

    const filaUsuario = page
      .getByRole("row")
      .filter({ hasText: `@${usuario.nombre_usuario}` });
    await expect(filaUsuario).toBeVisible();
    await filaUsuario.getByRole("button", { name: "Eliminar" }).click();

    const dialogo = page.getByRole("dialog");
    await expect(
      dialogo.getByRole("heading", { name: "Eliminar cuenta" })
    ).toBeVisible();
    await dialogo.getByRole("textbox", { name: "Motivo" }).fill(
      "Eliminación administrativa de prueba"
    );
    await dialogo.getByRole("button", { name: "Confirmar" }).click();

    await expect(dialogo).toHaveCount(0);
    await expect(filaUsuario).toContainText("eliminado");

    await page.goto(`/profile/${usuario.nombre_usuario}`);
    await expect(
      page.getByRole("heading", { name: "No encontramos ese perfil", level: 1 })
    ).toBeVisible();

    await page.context().clearCookies();
    await page.goto("/login");
    await campo(page, "Correo o nombre de usuario").fill(usuario.email);
    await campo(page, "Contraseña").fill(usuario.password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(errorDelServidor(page)).toHaveText("Credenciales inválidas");
    await expect(page).toHaveURL(/\/login$/);
  });
});
