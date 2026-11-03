import { expect, test } from "@playwright/test";

test("buscar por título lleva a la ficha de la película", async ({ page }) => {
  await page.goto("/catalogo");

  await page.getByRole("searchbox", { name: "Buscar películas y series por título" }).fill("Matrix");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(page).toHaveURL(/q=Matrix/);

  await page.getByRole("heading", { name: "Matrix", exact: true }).first().click();

  await expect(page).toHaveURL(/\/content\/pelicula\/\d+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Matrix");
});
