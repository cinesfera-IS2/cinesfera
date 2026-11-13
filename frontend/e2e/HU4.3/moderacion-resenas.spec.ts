import { expect, test } from "@playwright/test";

import {
  crearUsuarioNuevo,
  iniciarSesionAdministrador,
  publicarResena,
} from "../entorno/datos";

const CONTENIDO_HILO = { tmdbId: 13, ficha: "/content/pelicula/13" }; // Forrest Gump
const CONTENIDO_RESPUESTA = { tmdbId: 238, ficha: "/content/pelicula/238" }; // El padrino

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
      tmdbId: CONTENIDO_HILO.tmdbId,
      texto: textoResena,
      calificacion: 1,
    });
    const respuestaId = await publicarResena(primerRespondedor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_HILO.tmdbId,
      texto: textoRespuesta,
      resenaPadreId: resenaId,
    });
    await publicarResena(segundoRespondedor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_HILO.tmdbId,
      texto: textoAnidado,
      resenaPadreId: respuestaId,
    });

    await iniciarSesionAdministrador(page);
    await page.goto(CONTENIDO_HILO.ficha);
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

  test("4.3.2 al eliminar una respuesta la reseña principal y las demás siguen visibles", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autor", apellido: "Principal" });
    const autorEliminado = await crearUsuarioNuevo({
      nombre: "Respuesta",
      apellido: "Eliminada",
    });
    const autorConservado = await crearUsuarioNuevo({
      nombre: "Respuesta",
      apellido: "Conservada",
    });
    const textoPrincipal = `Reseña principal conservada ${autor.nombre_usuario}`;
    const textoEliminado = `Respuesta que será eliminada ${autorEliminado.nombre_usuario}`;
    const textoConservado = `Respuesta que seguirá visible ${autorConservado.nombre_usuario}`;

    const resenaId = await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_RESPUESTA.tmdbId,
      texto: textoPrincipal,
      calificacion: 4,
    });
    await publicarResena(autorEliminado, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_RESPUESTA.tmdbId,
      texto: textoEliminado,
      resenaPadreId: resenaId,
    });
    await publicarResena(autorConservado, {
      tipo: "pelicula",
      tmdbId: CONTENIDO_RESPUESTA.tmdbId,
      texto: textoConservado,
      resenaPadreId: resenaId,
    });

    await iniciarSesionAdministrador(page);
    await page.goto(CONTENIDO_RESPUESTA.ficha);
    await expect(page.getByText(textoPrincipal, { exact: true })).toBeVisible();
    await expect(page.getByText(textoEliminado, { exact: true })).toBeVisible();
    await expect(page.getByText(textoConservado, { exact: true })).toBeVisible();

    const respuesta = page.getByRole("article").filter({ hasText: textoEliminado });
    page.once("dialog", (dialogo) => dialogo.accept());
    await respuesta.getByRole("button", { name: "Eliminar reseña" }).click();

    await expect(page.getByText(textoEliminado, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoPrincipal, { exact: true })).toBeVisible();
    await expect(page.getByText(textoConservado, { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText(textoEliminado, { exact: true })).toHaveCount(0);
    await expect(page.getByText(textoPrincipal, { exact: true })).toBeVisible();
    await expect(page.getByText(textoConservado, { exact: true })).toBeVisible();
  });
});
