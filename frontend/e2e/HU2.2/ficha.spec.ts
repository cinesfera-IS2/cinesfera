import { expect, test, type Page } from "@playwright/test";

import { buscar } from "../entorno/catalogo";

// Los datos vienen de TMDB de verdad: se eligen obras viejas, con datos que ya
// no cambian (Breaking Bad terminó, así que sus temporadas quedan fijas).

function fichaTecnica(page: Page) {
  return page.getByRole("complementary", { name: "Ficha técnica" });
}

/** El valor de un dato de la ficha técnica, por su etiqueta. */
function datoDeLaFicha(page: Page, etiqueta: string) {
  return fichaTecnica(page)
    .locator("div")
    .filter({ has: page.getByRole("term").getByText(etiqueta, { exact: true }) })
    .getByRole("definition");
}

test.describe("HU2.2 · Ficha de una película o serie", () => {
  test("2.2.1 desde el catálogo se entra a la ficha de una película y se ven título, año, sinopsis y ficha técnica", async ({ page }) => {
    await page.goto("/catalogo");
    await buscar(page, "Matrix");
    await page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name: "Matrix", exact: true }) })
      .filter({ hasText: "Película·1999" })
      .first()
      .getByRole("link")
      .click();

    await expect(page).toHaveURL(/\/content\/pelicula\/603$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Matrix");
    await expect(page.getByRole("main").getByText("1999", { exact: true })).toBeVisible();

    const sinopsis = page.getByRole("region", { name: "Sinopsis" }).getByRole("paragraph");
    await expect(sinopsis).not.toHaveText("La sinopsis todavía no está disponible.");
    await expect(sinopsis).toHaveText(/\S.{40,}/);

    await expect(fichaTecnica(page)).toBeVisible();
    await expect(datoDeLaFicha(page, "Estreno")).toHaveText(/ de marzo de 1999$/);
    // Los minutos exactos los corrigen en TMDB cada tanto; alcanza con que estén.
    await expect(datoDeLaFicha(page, "Duración")).toHaveText(/^\d+ h \d+ min$/);
  });

  test("2.2.2 la ficha de una serie muestra la fecha del primer episodio y la cantidad de temporadas", async ({ page }) => {
    await page.goto("/content/serie/1396"); // Breaking Bad

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Breaking Bad");
    await expect(datoDeLaFicha(page, "Primer episodio")).toHaveText("20 de enero de 2008");
    await expect(datoDeLaFicha(page, "Temporadas")).toHaveText("5 temporadas");
  });
});
