import { expect, test } from "@playwright/test";

import {
  ADMINISTRADOR_E2E,
  iniciarSesion,
  USUARIO_EXISTENTE,
} from "../entorno/datos";
import { campo } from "../entorno/formularios";

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
});
