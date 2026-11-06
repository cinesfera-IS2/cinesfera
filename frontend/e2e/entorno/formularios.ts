import type { Page } from "@playwright/test";

/** Input por su etiqueta visible exacta ("Contraseña" no confunde al botón "Mostrar contraseña"). */
export function campo(page: Page, etiqueta: string) {
  return page.getByLabel(etiqueta, { exact: true });
}

// Dentro del formulario: Next también tiene un role="alert" (el anunciador de rutas).
export function errorDelServidor(page: Page) {
  return page.locator("form").getByRole("alert");
}
