import type { Page } from "@playwright/test";

export async function buscar(page: Page, texto: string) {
  await page.getByRole("searchbox", { name: "Buscar películas y series por título" }).fill(texto);
  await page.getByRole("button", { name: "Buscar" }).click();
}
