import { expect, test, type Page } from "@playwright/test";

// Usan TMDB de verdad (a través del backend de prueba), así que se eligen
// búsquedas con resultados estables: películas y series viejas y conocidas.

async function buscar(page: Page, texto: string) {
  await page.getByRole("searchbox", { name: "Buscar películas y series por título" }).fill(texto);
  await page.getByRole("button", { name: "Buscar" }).click();
}

/**
 * Espera a que se vea el filtro aplicado. Así se leen las tarjetas de la
 * búsqueda nueva y no las de la anterior, que siguen en pantalla mientras carga.
 */
/** Clic en la opción del selector de tipo, como lo haría una persona. */
async function elegirTipo(page: Page, opcion: "Todo" | "Películas" | "Series") {
  await page.getByRole("group", { name: "Tipo" }).getByText(opcion, { exact: true }).click();
}

async function esperarFiltro(page: Page, etiqueta: string) {
  await expect(page.getByRole("link", { name: `Quitar filtro ${etiqueta}` })).toBeVisible();
}

/** El renglón de cada tarjeta sin espacios, por ejemplo "Película·1999". */
async function detallesDeLasTarjetas(page: Page) {
  const tarjetas = page.getByRole("article");
  await expect(tarjetas.first()).toBeVisible();
  return tarjetas.locator("a > p").allTextContents();
}

test.describe("HU2.1 · Búsqueda por título", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/catalogo");
  });

  test("2.1.1 sin filtros aparecen resultados con ese título", async ({ page }) => {
    await buscar(page, "Matrix");

    await expect(page).toHaveURL(/[?&]q=Matrix/);
    await expect(page.getByRole("heading", { name: "Resultados para «Matrix»" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Matrix", exact: true }).first()).toBeVisible();
  });

  test("2.1.2 filtrando por año todos los resultados son de ese año", async ({ page }) => {
    await page.getByLabel("Año de estreno").fill("1999");
    await buscar(page, "Matrix");
    await esperarFiltro(page, "1999");

    const detalles = await detallesDeLasTarjetas(page);
    for (const detalle of detalles) {
      expect(detalle).toMatch(/·1999$/);
    }
  });

  test("2.1.3 con el selector de película salen solo películas", async ({ page }) => {
    await buscar(page, "Batman");
    await elegirTipo(page, "Películas");
    await esperarFiltro(page, "Películas");

    const detalles = await detallesDeLasTarjetas(page);
    for (const detalle of detalles) {
      expect(detalle).toMatch(/^Película·/);
    }
  });

  test("2.1.4 con el selector de serie salen solo series", async ({ page }) => {
    await buscar(page, "Batman");
    await elegirTipo(page, "Series");
    await esperarFiltro(page, "Series");

    const detalles = await detallesDeLasTarjetas(page);
    for (const detalle of detalles) {
      expect(detalle).toMatch(/^Serie·/);
    }
  });

  test("2.1.5 un texto que no existe muestra que no hay resultados", async ({ page }) => {
    await buscar(page, "faslfjwjgawgji");

    await expect(page.getByRole("heading", { name: "No encontramos resultados" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });
});
