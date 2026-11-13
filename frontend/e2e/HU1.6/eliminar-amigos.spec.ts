import { expect, test } from "@playwright/test";

import { crearUsuarioNuevo, iniciarSesion, seguirUsuario } from "../entorno/datos";
import { abrirAmigosDelPerfilPropio, botonSeguimiento, tarjetaSeguidores } from "../entorno/perfil";

test.describe("HU1.6 · Eliminar amigos", () => {
  test("1.6.1 al dejar de seguir a un usuario el botón vuelve a Seguir y sus seguidores bajan en uno", async ({ page }) => {
    const seguidor = await crearUsuarioNuevo({ nombre: "Pablo", apellido: "Díaz" });
    const seguido = await crearUsuarioNuevo({ nombre: "Carla", apellido: "Núñez" });
    await seguirUsuario(seguidor, seguido.id);

    await iniciarSesion(page, seguidor);
    await page.goto(`/profile/${seguido.nombre_usuario}`);
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*1$/);

    await botonSeguimiento(page, "Siguiendo").click();

    await expect(botonSeguimiento(page, "Seguir")).toBeVisible();
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*0$/);

    await page.reload();
    await expect(botonSeguimiento(page, "Seguir")).toBeVisible();
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*0$/);
  });

  test("1.6.2 al dejar de seguir a un amigo desaparece de la lista de amigos de los dos", async ({ browser, page }) => {
    const pablo = await crearUsuarioNuevo({ nombre: "Pablo", apellido: "Díaz" });
    const carla = await crearUsuarioNuevo({ nombre: "Carla", apellido: "Núñez" });
    await seguirUsuario(pablo, carla.id);
    await seguirUsuario(carla, pablo.id);

    await iniciarSesion(page, pablo);
    await page.goto(`/profile/${carla.nombre_usuario}`);
    await botonSeguimiento(page, "Amigos").click();
    await page
      .getByRole("dialog", { name: "¿Dejar de seguir a este amigo?" })
      .getByRole("button", { name: "Dejar de seguir" })
      .click();
    await expect(botonSeguimiento(page, "Seguir")).toBeVisible();

    const amigosDePablo = await abrirAmigosDelPerfilPropio(page, pablo);
    await expect(amigosDePablo.getByText("Todavía no tenés amigos.")).toBeVisible();
    await expect(amigosDePablo.getByRole("listitem")).toHaveCount(0);

    const contextoDeCarla = await browser.newContext();
    try {
      const paginaDeCarla = await contextoDeCarla.newPage();
      await iniciarSesion(paginaDeCarla, carla);

      const amigosDeCarla = await abrirAmigosDelPerfilPropio(paginaDeCarla, carla);
      await expect(amigosDeCarla.getByText("Todavía no tenés amigos.")).toBeVisible();
      await expect(amigosDeCarla.getByRole("listitem")).toHaveCount(0);
    } finally {
      await contextoDeCarla.close();
    }
  });
});
