import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { ProfileEditDialog } from "./profile-edit-dialog";
import type { PerfilPublico } from "@/features/profile/types";

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "Ana",
  apellido: "Torres",
  email: "ana@example.com",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  bio: "Fan de los thrillers.",
  generosFavoritos: [],
  estadisticas: { resenas: 0, vistas: 0, seguidores: 0, siguiendo: 0 },
};

function dialogo() {
  return screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
}

describe("ProfileEditDialog", () => {
  // jsdom no implementa la apertura de <dialog>.
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
  });

  afterEach(cleanup);

  async function abrir() {
    render(<ProfileEditDialog perfil={PERFIL} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));
  }

  it("arranca cerrado y se abre con el botón", async () => {
    render(<ProfileEditDialog perfil={PERFIL} />);
    expect(dialogo().open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));

    expect(dialogo().open).toBe(true);
  });

  it("precarga los datos actuales del perfil", async () => {
    await abrir();

    const valor = (etiqueta: string) =>
      (screen.getByLabelText(etiqueta) as HTMLInputElement).value;
    expect(valor("Nombre")).toBe("Ana");
    expect(valor("Apellido")).toBe("Torres");
    expect(valor("Nombre de usuario")).toBe("anatorres");
    expect(valor("Correo electrónico")).toBe("ana@example.com");
    expect(valor("Foto de perfil (URL)")).toBe("");
    expect(valor("Sobre vos")).toBe("Fan de los thrillers.");
  });

  it.each(["Cerrar", "Cancelar", "Guardar cambios"])(
    "se cierra con '%s'",
    async (boton) => {
      await abrir();

      await userEvent.click(screen.getByRole("button", { name: boton }));

      expect(dialogo().open).toBe(false);
    }
  );
});
