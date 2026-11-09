import { expect, test } from "@playwright/test";

import { crearUsuarioNuevo, iniciarSesion, seguirUsuario } from "../entorno/datos";
import { abrirAmigosDelPerfilPropio, botonSeguimiento, tarjetaSeguidores } from "../entorno/perfil";

test.describe("HU1.5 · Agregar amigos", () => {
  test("1.5.1 al seguir a un usuario el botón pasa a Siguiendo y sus seguidores suben en uno", async ({ page }) => {
    const seguidor = await crearUsuarioNuevo({ nombre: "Pablo", apellido: "Díaz" });
    const seguido = await crearUsuarioNuevo({ nombre: "Carla", apellido: "Núñez" });

    await iniciarSesion(page, seguidor);
    await page.goto(`/profile/${seguido.nombre_usuario}`);
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*0$/);

    await botonSeguimiento(page, "Seguir").click();

    await expect(botonSeguimiento(page, "Siguiendo")).toBeVisible();
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*1$/);

    await page.reload();
    await expect(botonSeguimiento(page, "Siguiendo")).toBeVisible();
    await expect(tarjetaSeguidores(page)).toHaveText(/Seguidores\s*1$/);
  });

  test("1.5.2 si los dos se siguen mutuamente, cada uno aparece en la lista de amigos del otro", async ({ browser, page }) => {
    const pablo = await crearUsuarioNuevo({ nombre: "Pablo", apellido: "Díaz" });
    const carla = await crearUsuarioNuevo({ nombre: "Carla", apellido: "Núñez" });
    await seguirUsuario(carla, pablo.id);

    await iniciarSesion(page, pablo);
    await page.goto(`/profile/${carla.nombre_usuario}`);
    await botonSeguimiento(page, "Seguir").click();
    await expect(botonSeguimiento(page, "Amigos")).toBeVisible();

    const amigosDePablo = (await abrirAmigosDelPerfilPropio(page, pablo)).getByRole("listitem");
    await expect(amigosDePablo).toHaveCount(1);
    await expect(amigosDePablo).toContainText(`@${carla.nombre_usuario}`);

    const contextoDeCarla = await browser.newContext();
    try {
      const paginaDeCarla = await contextoDeCarla.newPage();
      await iniciarSesion(paginaDeCarla, carla);

      const amigosDeCarla = (await abrirAmigosDelPerfilPropio(paginaDeCarla, carla)).getByRole("listitem");
      await expect(amigosDeCarla).toHaveCount(1);
      await expect(amigosDeCarla).toContainText(`@${pablo.nombre_usuario}`);
    } finally {
      await contextoDeCarla.close();
    }
  });
});
