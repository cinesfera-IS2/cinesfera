import { expect, test } from "@playwright/test";

import {
  crearUsuarioNuevo,
  iniciarSesion,
  publicarResena,
} from "../entorno/datos";

const FICHA = "/content/pelicula/550"; // El club de la pelea

test.describe("HU4.2 · Calificar reseñas ajenas", () => {
  test("4.2.1 al calificar la reseña de otro usuario la valoración queda registrada", async ({ page }) => {
    const autor = await crearUsuarioNuevo({ nombre: "Autor", apellido: "Reseña" });
    const lector = await crearUsuarioNuevo({ nombre: "Lector", apellido: "Crítico" });
    const textoResena = `Reseña para valorar ${autor.nombre_usuario}`;
    const textoRespuesta = `Esta reseña aporta valor ${lector.nombre_usuario}`;

    await publicarResena(autor, {
      tipo: "pelicula",
      tmdbId: 550,
      texto: textoResena,
      calificacion: 3.5,
    });
    await iniciarSesion(page, lector);

    await page.goto(FICHA);
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
});
