import { expect, test } from "@playwright/test";

import {
  actualizarPerfil,
  crearUsuarioNuevo,
  iniciarSesion,
  publicarResena,
  USUARIO_EXISTENTE,
} from "../entorno/datos";

test.describe("HU1.4 · Ver el perfil de otro usuario", () => {
  test("1.4.1 desde Comunidad se busca a un usuario y su perfil muestra nombre, usuario y datos", async ({ page }) => {
    const lucia = await crearUsuarioNuevo({ nombre: "Lucía", apellido: "Méndez" });
    await actualizarPerfil(lucia, {
      bio: "Fan del cine de terror de los 80",
      ubicacion: "Montevideo, Uruguay",
    });

    // Buscar usuarios requiere sesión: se busca con otra cuenta.
    await iniciarSesion(page, USUARIO_EXISTENTE);
    await page.goto("/comunidad");

    await page.getByLabel("Nombre o nombre de usuario").fill(lucia.nombre_usuario);
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page
      .getByRole("list", { name: "Resultados de usuarios" })
      .getByRole("link", { name: `@${lucia.nombre_usuario}` })
      .click();

    await expect(page).toHaveURL(new RegExp(`/profile/${lucia.nombre_usuario}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lucía Méndez");
    await expect(page.getByText(`@${lucia.nombre_usuario}`, { exact: true })).toBeVisible();
    await expect(page.getByText("Fan del cine de terror de los 80")).toBeVisible();
    await expect(page.getByText("Montevideo, Uruguay")).toBeVisible();
  });

  test("1.4.2 el perfil muestra las reseñas que publicó pero no sus respuestas a otras reseñas", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Martín", apellido: "Silva" });
    const otro = await crearUsuarioNuevo({ nombre: "Sofía", apellido: "Pérez" });

    const resenaDeOtro = await publicarResena(otro, {
      tipo: "pelicula",
      tmdbId: 550,
      texto: "Reseña de Sofía sobre El club de la pelea",
      calificacion: 4,
    });
    await publicarResena(autor, {
      tipo: "serie",
      tmdbId: 1399,
      texto: "Reseña propia de Martín sobre Juego de tronos",
      calificacion: 5,
    });
    await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: 550,
      texto: "Respuesta de Martín a la reseña de Sofía",
      resenaPadreId: resenaDeOtro,
    });

    await page.goto(`/profile/${autor.nombre_usuario}`);

    const resenas = page.getByRole("tabpanel");
    await expect(resenas.getByText("Reseña propia de Martín sobre Juego de tronos")).toBeVisible();
    await expect(resenas.getByText("Respuesta de Martín a la reseña de Sofía")).toHaveCount(0);
    await expect(resenas.getByRole("article")).toHaveCount(1);
  });
});
