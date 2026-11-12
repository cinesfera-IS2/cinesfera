import { expect, test } from "@playwright/test";

import {
  crearUsuarioNuevo,
  iniciarSesion,
  publicarResena,
} from "../entorno/datos";

const CONTENIDO_REGISTRO = { tmdbId: 27205, ficha: "/content/pelicula/27205" }; // El origen
const CONTENIDO_PROPIO = { tmdbId: 157336, ficha: "/content/pelicula/157336" }; // Interestelar
const CONTENIDO_UNICO = { tmdbId: 155, ficha: "/content/pelicula/155" }; // Batman: El caballero de la noche

test.describe("HU4.2 · Calificar reseñas ajenas", () => {
  test("4.2.1 al calificar la reseña de otro usuario la valoración queda registrada", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autor", apellido: "Reseña" });
    const lector = await crearUsuarioNuevo({ nombre: "Lector", apellido: "Crítico" });
    const textoResena = `Reseña para valorar ${autor.nombre_usuario}`;
    const textoRespuesta = `Esta reseña aporta valor ${lector.nombre_usuario}`;

    await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_REGISTRO.tmdbId,
      texto: textoResena,
      calificacion: 3.5,
    });
    await iniciarSesion(page, lector);

    await page.goto(CONTENIDO_REGISTRO.ficha);
    const resenaAjena = page.getByRole("article").filter({ hasText: textoResena });
    await expect(resenaAjena).toBeVisible();
    await resenaAjena.getByRole("button", { name: "Responder" }).click();

    const dialogo = page.getByRole("dialog", { name: "Responder reseña" });
    await dialogo.getByRole("checkbox", { name: "Incluir valoración" }).check();
    await dialogo
      .getByRole("radio", { name: "4 estrellas", exact: true })
      .check({ force: true });
    await dialogo.getByRole("textbox", { name: "Tu respuesta" }).fill(textoRespuesta);
    await dialogo.getByRole("button", { name: "Publicar" }).click();

    await expect(dialogo).toBeHidden();
    await expect(page.getByText(textoRespuesta, { exact: true })).toBeVisible();

    await page.reload();
    const resenaRecargada = page.getByRole("article").filter({ hasText: textoResena });
    await expect(resenaRecargada.getByText("4/5", { exact: true })).toBeVisible();
  });

  test("4.2.2 en una reseña propia no aparece la opción de calificar", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autora", apellido: "Propia" });
    const textoResena = `Reseña propia sin valoración comunitaria ${autor.nombre_usuario}`;

    await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_PROPIO.tmdbId,
      texto: textoResena,
      calificacion: 4.5,
    });
    await iniciarSesion(page, autor);

    await page.goto(CONTENIDO_PROPIO.ficha);
    const resenaPropia = page.getByRole("article").filter({ hasText: textoResena });
    await expect(resenaPropia).toBeVisible();
    await resenaPropia.getByRole("button", { name: "Responder" }).click();

    const dialogo = page.getByRole("dialog", { name: "Responder reseña" });
    await expect(dialogo).toBeVisible();
    await expect(
      dialogo.getByRole("checkbox", { name: "Incluir valoración" })
    ).toHaveCount(0);
    await expect(dialogo.getByRole("radio")).toHaveCount(0);
  });

  test("4.2.3 después de calificar solo aparece la opción de editar la valoración", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autor", apellido: "Valorable" });
    const lector = await crearUsuarioNuevo({ nombre: "Lector", apellido: "Valorador" });
    const textoResena = `Reseña con una única valoración ${autor.nombre_usuario}`;

    await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_UNICO.tmdbId,
      texto: textoResena,
      calificacion: 3,
    });
    await iniciarSesion(page, lector);

    await page.goto(CONTENIDO_UNICO.ficha);
    const resenaAjena = page.getByRole("article").filter({ hasText: textoResena });
    await resenaAjena.getByRole("button", { name: "Responder" }).click();

    const dialogo = page.getByRole("dialog", { name: "Responder reseña" });
    await dialogo.getByRole("checkbox", { name: "Incluir valoración" }).check();
    await dialogo
      .getByRole("radio", { name: "2.5 estrellas", exact: true })
      .check({ force: true });
    await dialogo.getByRole("textbox", { name: "Tu respuesta" }).fill(
      `Valoración única de ${lector.nombre_usuario}`
    );
    await dialogo.getByRole("button", { name: "Publicar" }).click();
    await expect(dialogo).toBeHidden();

    await page.reload();
    const resenaRecargada = page.getByRole("article").filter({ hasText: textoResena });
    await expect(
      resenaRecargada.getByRole("button", { name: "Editar valoración" })
    ).toBeVisible();

    await resenaRecargada.getByRole("button", { name: "Responder" }).click();
    await expect(dialogo).toBeVisible();
    await expect(
      dialogo.getByRole("checkbox", { name: "Incluir valoración" })
    ).toHaveCount(0);
    await expect(dialogo.getByRole("radio")).toHaveCount(0);
  });
});
