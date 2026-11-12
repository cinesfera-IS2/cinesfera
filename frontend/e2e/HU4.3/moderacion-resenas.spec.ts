import { expect, test } from "@playwright/test";

import {
  crearUsuarioNuevo,
  iniciarSesionAdministrador,
  publicarResena,
} from "../entorno/datos";

const CONTENIDO = { tmdbId: 13, ficha: "/content/pelicula/13" }; // Forrest Gump

test.describe("HU4.3 · Moderar reseñas", () => {
  test("4.3.1 un administrador elimina una reseña y todas sus respuestas", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autor", apellido: "Moderado" });
    const primerRespondedor = await crearUsuarioNuevo({
      nombre: "Primera",
      apellido: "Respuesta",
    });
    const segundoRespondedor = await crearUsuarioNuevo({
      nombre: "Segunda",
      apellido: "Respuesta",
    });
    const textoResena = `Reseña ofensiva o spam ${autor.nombre_usuario}`;
    const textoRespuesta = `Respuesta directa ${primerRespondedor.nombre_usuario}`;
    const textoAnidado = `Respuesta anidada ${segundoRespondedor.nombre_usuario}`;

    const resenaId = await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO.tmdbId,
      texto: textoResena,
      calificacion: 1,
    });
    const respuestaId = await publicarResena(primerRespondedor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO.tmdbId,
      texto: textoRespuesta,
      resenaPadreId: resenaId,
    });
    await publicarResena(segundoRespondedor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO.tmdbId,
      texto: textoAnidado,
      resenaPadreId: respuestaId,
    });

    await iniciarSesionAdministrador(page);
    await page.goto(CONTENIDO.ficha);
    await expect(page.getByText(textoResena, { exact: true })).toBeVisible();
    await expect(page.getByText(textoRespuesta, { exact: true })).toBeVisible();
    await expect(page.getByText(textoAnidado, { exact: true })).toBeVisible();

    const resena = page.getByRole("article").filter({ hasText: textoResena });
    page.once("dialog", (dialogo) => dialogo.accept());
    await resena.getByRole("button", { name: "Eliminar reseña" }).click();

    await expect(page.getByText(textoResena, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoRespuesta, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoAnidado, { exact: true })).toHaveCount(0);

    await page.reload();
    await expect(page.getByText(textoResena, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoRespuesta, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoAnidado, { exact: true })).toHaveCount(0);
  });
});
