import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ProfileEditDialog } from "./profile-edit-dialog";
import type { PerfilPublico } from "@/features/profile/types";
import { apiFetch } from "@/lib/api";

const { replaceMock, refreshMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiFetch: vi.fn(),
}));

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "Ana",
  apellido: "Torres",
  email: "ana@example.com",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  bio: "Fan de los thrillers.",
  ubicacion: "Montevideo, Uruguay",
  generosFavoritos: ["Drama"],
  estadisticas: { resenas: 0, seguidores: 0, siguiendo: 0 },
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

  afterEach(() => {
    cleanup();
    vi.mocked(apiFetch).mockReset();
    replaceMock.mockReset();
    refreshMock.mockReset();
  });

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
    expect(valor("Foto de perfil (URL)")).toBe("");
    expect(valor("Ubicación")).toBe("Montevideo, Uruguay");
    expect(valor("Sobre vos")).toBe("Fan de los thrillers.");
    expect(valor("Géneros favoritos")).toBe("Drama");
  });

  it.each(["Cerrar", "Cancelar", "Guardar cambios"])(
    "se cierra con '%s'",
    async (boton) => {
      await abrir();

      await userEvent.click(screen.getByRole("button", { name: boton }));

      expect(dialogo().open).toBe(false);
    }
  );

  it("guarda los cambios y navega si cambia el nombre de usuario", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ nombre_usuario: "ana.nueva" });
    await abrir();

    const usuario = screen.getByLabelText("Nombre de usuario");
    await userEvent.clear(usuario);
    await userEvent.type(usuario, "ana.nueva");
    const bio = screen.getByLabelText("Sobre vos");
    await userEvent.clear(bio);
    await userEvent.type(bio, "Nueva biografía");
    const generos = screen.getByLabelText("Géneros favoritos");
    await userEvent.clear(generos);
    await userEvent.type(generos, "Drama, Comedia");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/profile/ana.nueva"));
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/usuarios/u1/perfil", {
      method: "PATCH",
      headers: { "X-CSRF-Token": "csrf-prueba" },
      body: JSON.stringify({
        nombre_usuario: "ana.nueva",
        bio: "Nueva biografía",
        generos_favoritos: ["Drama", "Comedia"],
      }),
    });
  });

  it("mantiene el diálogo abierto si el backend rechaza los cambios", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockRejectedValueOnce(new Error("fallo"));
    await abrir();

    await userEvent.clear(screen.getByLabelText("Nombre"));
    await userEvent.type(screen.getByLabelText("Nombre"), "Beatriz");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudieron guardar los cambios"
    );
    expect(dialogo().open).toBe(true);
  });
});
