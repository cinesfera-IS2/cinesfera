import type { Page } from "@playwright/test";

import type { DatosUsuario } from "./datos";

export function tarjetaSeguidores(page: Page) {
  return page.getByRole("button", { name: "Ver seguidores" });
}

export function botonSeguimiento(page: Page, etiqueta: "Seguir" | "Siguiendo" | "Amigos") {
  return page.getByRole("button", { name: etiqueta, exact: true });
}

/** Abre la lista de amigos, que solo se ve en el perfil propio. */
export async function abrirAmigosDelPerfilPropio(page: Page, usuario: DatosUsuario) {
  await page.goto(`/profile/${usuario.nombre_usuario}`);
  await page.getByRole("button", { name: "Ver amigos" }).click();
  return page.getByRole("dialog", { name: "Conexiones" });
}
