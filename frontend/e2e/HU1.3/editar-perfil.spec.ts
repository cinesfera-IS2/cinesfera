import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { crearUsuarioNuevo, iniciarSesion, type DatosUsuario } from "../entorno/datos";
import { campo } from "../entorno/formularios";

const FOTO_DE_PRUEBA = path.join(__dirname, "../entorno/foto-perfil.png");

async function abrirEdicion(page: Page, usuario: DatosUsuario) {
  await iniciarSesion(page, usuario);
  await page.goto(`/profile/${usuario.nombre_usuario}`);
  await page.getByRole("button", { name: "Editar perfil" }).click();
  const dialogo = page.getByRole("dialog", { name: "Editar perfil" });
  await expect(dialogo).toBeVisible();
  return dialogo;
}

// El menú de la cuenta y el formulario de edición, aunque estén cerrados,
// también contienen el usuario y la biografía.
function textoVisible(page: Page, texto: string) {
  return page.getByText(texto, { exact: true }).filter({ visible: true });
}

test.describe("HU1.3 · Completar el perfil", () => {
  test("1.3.1 un nombre de una letra muestra el error y no se guarda", async ({ page }) => {
    const usuario = await crearUsuarioNuevo({ nombre: "Ana", apellido: "Torres" });
    const dialogo = await abrirEdicion(page, usuario);

    await campo(page, "Nombre").fill("A");
    await dialogo.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(dialogo.getByRole("alert")).toHaveText("String should have at least 2 characters");
    await expect(dialogo).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ana Torres");
  });

  test("1.3.1 un nombre de usuario con mayúsculas no pasa la validación y no se guarda", async ({ page }) => {
    const usuario = await crearUsuarioNuevo();
    const dialogo = await abrirEdicion(page, usuario);

    const nombreUsuario = campo(page, "Nombre de usuario");
    await nombreUsuario.fill("AnaTorres");
    await dialogo.getByRole("button", { name: "Guardar cambios" }).click();

    // El navegador frena el envío por el `pattern` del campo y muestra su aviso.
    await expect(nombreUsuario).toHaveJSProperty("validity.patternMismatch", true);
    expect(await nombreUsuario.evaluate((input: HTMLInputElement) => input.validationMessage)).not.toBe("");
    await expect(dialogo).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/profile/${usuario.nombre_usuario}$`));
    await expect(textoVisible(page, `@${usuario.nombre_usuario}`)).toBeVisible();
  });

  test("1.3.1 la biografía no acepta más de 280 caracteres y el exceso no se guarda", async ({ page }) => {
    const usuario = await crearUsuarioNuevo();
    const dialogo = await abrirEdicion(page, usuario);
    const permitida = "Cine de autor, terror de los 80 y maratones de series. ".repeat(6).slice(0, 280);

    const bio = dialogo.getByLabel("Sobre vos");
    await bio.fill(`${permitida}TEXTO DE MAS`);
    await expect(bio).toHaveValue(permitida);

    await dialogo.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialogo).toBeHidden();

    await page.reload();
    await expect(textoVisible(page, permitida.trim())).toBeVisible();
    await expect(page.getByText("TEXTO DE MAS")).toHaveCount(0);
  });

  test("1.3.2 con datos correctos los cambios se ven en el perfil y se mantienen al recargar", async ({ page }) => {
    const usuario = await crearUsuarioNuevo({ nombre: "Ana", apellido: "Torres" });
    const nuevoNombreUsuario = `${usuario.nombre_usuario}_nuevo`;
    const dialogo = await abrirEdicion(page, usuario);

    await campo(page, "Nombre").fill("Lucía");
    await campo(page, "Apellido").fill("Méndez");
    await campo(page, "Nombre de usuario").fill(nuevoNombreUsuario);
    await campo(page, "Ubicación").fill("Montevideo, Uruguay");
    await dialogo.getByLabel("Sobre vos").fill("Fan del cine de terror de los 80");
    await dialogo.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(dialogo).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/profile/${nuevoNombreUsuario}$`));

    for (const momento of ["después de guardar", "después de recargar"]) {
      if (momento === "después de recargar") await page.reload();
      await expect(page.getByRole("heading", { level: 1 }), momento).toHaveText("Lucía Méndez");
      await expect(textoVisible(page, `@${nuevoNombreUsuario}`), momento).toBeVisible();
      await expect(textoVisible(page, "Fan del cine de terror de los 80"), momento).toBeVisible();
      await expect(textoVisible(page, "Montevideo, Uruguay"), momento).toBeVisible();
    }
  });

  test("1.3.3 subir una imagen como foto de perfil la muestra en el perfil", async ({ page }) => {
    const usuario = await crearUsuarioNuevo({ nombre: "Ana", apellido: "Torres" });
    const dialogo = await abrirEdicion(page, usuario);
    const foto = page.getByRole("img", { name: "Foto de Ana Torres" });
    await expect(foto).toHaveCount(0);

    await dialogo.getByLabel("Subir foto").setInputFiles(FOTO_DE_PRUEBA);
    const recorte = page.getByRole("dialog", { name: "Ajustar foto" });
    await recorte.getByRole("button", { name: "Usar este recorte" }).click();
    await expect(recorte).toBeHidden();
    await expect(dialogo.getByRole("img", { name: "Vista previa de la foto de perfil" })).toBeVisible();

    await dialogo.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(dialogo).toBeHidden();

    for (const momento of ["después de guardar", "después de recargar"]) {
      if (momento === "después de recargar") await page.reload();
      await expect(foto, momento).toHaveAttribute("src", new RegExp(`/usuarios/${usuario.id}/foto-perfil`));
      // Que la imagen haya cargado de verdad: el recorte se guarda en 512 × 512.
      await expect.poll(() => foto.evaluate((img: HTMLImageElement) => img.naturalWidth), { message: momento }).toBe(512);
    }
  });
});
