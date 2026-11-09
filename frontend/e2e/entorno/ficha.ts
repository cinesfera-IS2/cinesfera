import type { Page } from "@playwright/test";

export function fichaTecnica(page: Page) {
  return page.getByRole("complementary", { name: "Ficha técnica" });
}

export function seccionResenas(page: Page) {
  return page.getByRole("region", { name: /^Reseñas/ });
}
