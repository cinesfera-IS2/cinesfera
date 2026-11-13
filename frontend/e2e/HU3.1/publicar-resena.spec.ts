import { expect, test, type Locator, type Page } from "@playwright/test";

import { crearUsuarioNuevo, iniciarSesion, publicarResena } from "../entorno/datos";
import { fichaTecnica, seccionResenas } from "../entorno/ficha";

// Cada caso que puede publicar usa su propia película, así las reseñas de un
// test no aparecen en otro que corre en paralelo.
const FORREST_GUMP = 13;
const PULP_FICTION = 680;

async function abrirNuevaResena(page: Page) {
  await page.getByRole("button", { name: "Escribir una reseña" }).click();
  return page.getByRole("dialog", { name: "Nueva reseña" });
}

/** Clic sobre la estrella: el radio de cada valor está oculto debajo. */
async function elegirEstrellas(dialogo: Locator, cantidad: number) {
  const etiqueta = `${cantidad} ${cantidad === 1 ? "estrella" : "estrellas"}`;
  await dialogo.locator("label").filter({ hasText: new RegExp(`^${etiqueta}$`) }).click();
  await expect(dialogo.getByRole("radio", { name: etiqueta, exact: true })).toBeChecked();
}

test.describe("HU3.1 · Publicar una reseña", () => {
  test("3.1.1 con estrellas y texto se publica y aparece primera en la lista de reseñas", async ({ page }) => {
    const otro = await crearUsuarioNuevo({ nombre: "Sofía", apellido: "Pérez" });
    const autor = await crearUsuarioNuevo({ nombre: "Martín", apellido: "Silva" });
    await publicarResena(otro, {
      tipo: "pelicula",
      tmdbId: FORREST_GUMP,
      texto: "Reseña anterior de Sofía",
      calificacion: 3,
    });

    await iniciarSesion(page, autor);
    await page.goto(`/content/pelicula/${FORREST_GUMP}`);
    await expect(seccionResenas(page).getByRole("article")).toHaveCount(1);

    const dialogo = await abrirNuevaResena(page);
    await elegirEstrellas(dialogo, 4);
    await dialogo.getByLabel("Tu reseña").fill("Una historia enorme, contada con mucha ternura.");
    await dialogo.getByRole("button", { name: "Publicar" }).click();

    await expect(dialogo).toBeHidden();
    const resenas = seccionResenas(page).getByRole("article");
    await expect(resenas).toHaveCount(2);
    await expect(resenas.first()).toContainText("Una historia enorme, contada con mucha ternura.");
    await expect(resenas.first()).toContainText(`@${autor.nombre_usuario}`);
    await expect(resenas.first().getByRole("img", { name: "4 de 5 estrellas" })).toBeVisible();
    await expect(resenas.nth(1)).toContainText("Reseña anterior de Sofía");
  });

  test("3.1.2 sin elegir estrellas avisa que falta la calificación y no se publica", async ({ page }) => {
    await iniciarSesion(page, await crearUsuarioNuevo());
    await page.goto(`/content/pelicula/${PULP_FICTION}`);

    const dialogo = await abrirNuevaResena(page);
    await dialogo.getByLabel("Tu reseña").fill("Me encantó, pero me olvidé de las estrellas.");
    await dialogo.getByRole("button", { name: "Publicar" }).click();

    await expect(dialogo.getByRole("alert")).toHaveText("Elegí una calificación marcando las estrellas.");
    await expect(dialogo).toBeVisible();
    await page.reload();
    await expect(seccionResenas(page).getByText("Todavía no existen reseñas")).toBeVisible();
  });

  test("3.1.3 sin texto avisa que falta escribir la reseña y no se publica", async ({ page }) => {
    await iniciarSesion(page, await crearUsuarioNuevo());
    await page.goto(`/content/pelicula/${PULP_FICTION}`);

    const dialogo = await abrirNuevaResena(page);
    await elegirEstrellas(dialogo, 4);
    await dialogo.getByRole("button", { name: "Publicar" }).click();

    await expect(dialogo.getByRole("alert")).toHaveText("Escribí una reseña antes de publicarla.");
    await expect(dialogo).toBeVisible();
    await page.reload();
    await expect(seccionResenas(page).getByText("Todavía no existen reseñas")).toBeVisible();
  });

  test("3.1.4 sin sesión la ficha muestra Iniciar sesión en lugar de Escribir una reseña", async ({ page }) => {
    await page.goto(`/content/pelicula/${PULP_FICTION}`);

    await expect(fichaTecnica(page).getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Escribir una reseña" })).toHaveCount(0);
  });
});
