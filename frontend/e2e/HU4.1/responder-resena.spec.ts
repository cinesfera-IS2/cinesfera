import { expect, test, type Locator, type Page } from "@playwright/test";

import { crearUsuarioNuevo, iniciarSesion, publicarResena } from "../entorno/datos";
import { seccionResenas } from "../entorno/ficha";

// Cada caso usa su propia película, así las reseñas de uno no aparecen en el otro.
const BATMAN_EL_CABALLERO_DE_LA_NOCHE = 155;
const SUENOS_DE_LIBERTAD = 278;

function resena(page: Page, texto: string) {
  return seccionResenas(page).getByRole("article").filter({ hasText: texto });
}

/** Las respuestas no van dentro de la reseña: se dibujan en el bloque que le sigue. */
function respuestasDe(resena: Locator) {
  return resena.locator("xpath=following-sibling::div[1]").getByRole("article");
}

async function abrirRespuesta(page: Page, resena: Locator) {
  await resena.getByRole("button", { name: "Responder" }).click();
  return page.getByRole("dialog", { name: "Responder reseña" });
}

test.describe("HU4.1 · Responder la reseña de otro usuario", () => {
  test("4.1.1 la respuesta aparece debajo de la reseña a la que se responde", async ({ page }) => {
    const sofia = await crearUsuarioNuevo({ nombre: "Sofía", apellido: "Pérez" });
    const lucas = await crearUsuarioNuevo({ nombre: "Lucas", apellido: "Rey" });
    const martin = await crearUsuarioNuevo({ nombre: "Martín", apellido: "Silva" });
    await publicarResena(sofia, {
      tipo: "pelicula",
      tmdbId: BATMAN_EL_CABALLERO_DE_LA_NOCHE,
      texto: "El Joker se roba la película",
      calificacion: 5,
    });
    await publicarResena(lucas, {
      tipo: "pelicula",
      tmdbId: BATMAN_EL_CABALLERO_DE_LA_NOCHE,
      texto: "Larga, pero vale cada minuto",
      calificacion: 4,
    });

    await iniciarSesion(page, martin);
    await page.goto(`/content/pelicula/${BATMAN_EL_CABALLERO_DE_LA_NOCHE}`);

    const dialogo = await abrirRespuesta(page, resena(page, "El Joker se roba la película"));
    await dialogo.getByLabel("Tu respuesta").fill("Totalmente, y Harvey Dent también.");
    await dialogo.getByRole("button", { name: "Publicar" }).click();
    await expect(dialogo).toBeHidden();

    const respuestasASofia = respuestasDe(resena(page, "El Joker se roba la película"));
    await expect(respuestasASofia).toHaveCount(1);
    await expect(respuestasASofia).toContainText("Totalmente, y Harvey Dent también.");
    await expect(respuestasASofia).toContainText(`@${martin.nombre_usuario}`);
    await expect(respuestasDe(resena(page, "Larga, pero vale cada minuto"))).toHaveCount(0);
  });

  test("4.1.2 una respuesta vacía avisa que falta escribirla y no se publica", async ({ page }) => {
    const sofia = await crearUsuarioNuevo({ nombre: "Sofía", apellido: "Pérez" });
    await publicarResena(sofia, {
      tipo: "pelicula",
      tmdbId: SUENOS_DE_LIBERTAD,
      texto: "La mejor película sobre la esperanza",
      calificacion: 5,
    });

    await iniciarSesion(page, await crearUsuarioNuevo());
    await page.goto(`/content/pelicula/${SUENOS_DE_LIBERTAD}`);

    const dialogo = await abrirRespuesta(page, resena(page, "La mejor película sobre la esperanza"));
    await dialogo.getByRole("button", { name: "Publicar" }).click();

    await expect(dialogo.getByRole("alert")).toHaveText("Escribí tu respuesta antes de publicarla.");
    await expect(dialogo).toBeVisible();
    await page.reload();
    await expect(seccionResenas(page).getByRole("article")).toHaveCount(1);
    await expect(respuestasDe(resena(page, "La mejor película sobre la esperanza"))).toHaveCount(0);
  });
});
