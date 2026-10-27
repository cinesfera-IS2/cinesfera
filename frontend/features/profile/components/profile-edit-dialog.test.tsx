import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

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

const GENEROS = [
  { id: 28, nombre: "Acción" },
  { id: 12, nombre: "Aventura" },
  { id: 35, nombre: "Comedia" },
  { id: 18, nombre: "Drama" },
  { id: 14, nombre: "Fantasía" },
  { id: 27, nombre: "Terror" },
];

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

  beforeEach(() => {
    vi.mocked(apiFetch).mockImplementation(async (ruta) => {
      if (ruta === "/contenidos/generos") return GENEROS as never;
      throw new Error(`Pedido inesperado: ${ruta}`);
    });
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
    await screen.findByRole("button", { name: "Drama" });
  }

  it("arranca cerrado y se abre con el botón", async () => {
    render(<ProfileEditDialog perfil={PERFIL} />);
    expect(dialogo().open).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: "Editar perfil" }));

    expect(dialogo().open).toBe(true);
    expect(await screen.findByRole("button", { name: "Drama" })).toBeTruthy();
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
    expect(
      screen.getByRole("button", { name: "Drama" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.getByText("1 de 5 seleccionados")).toBeTruthy();
  });

  it("permite elegir hasta cinco géneros mediante tarjetas", async () => {
    await abrir();

    for (const genero of ["Acción", "Aventura", "Comedia", "Fantasía"]) {
      await userEvent.click(screen.getByRole("button", { name: genero }));
    }

    expect(screen.getByText("5 de 5 seleccionados")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Terror" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);

    await userEvent.click(screen.getByRole("button", { name: "Drama" }));
    expect(screen.getByText("4 de 5 seleccionados")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Terror" }) as HTMLButtonElement)
        .disabled
    ).toBe(false);
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
    vi.mocked(apiFetch).mockImplementation(async (ruta) => {
      if (ruta === "/contenidos/generos") return GENEROS as never;
      if (ruta === "/auth/csrf") return { csrf_token: "csrf-prueba" } as never;
      if (ruta === "/usuarios/u1/perfil") {
        return { nombre_usuario: "ana.nueva" } as never;
      }
      throw new Error(`Pedido inesperado: ${ruta}`);
    });
    await abrir();

    const usuario = screen.getByLabelText("Nombre de usuario");
    await userEvent.clear(usuario);
    await userEvent.type(usuario, "ana.nueva");
    const bio = screen.getByLabelText("Sobre vos");
    await userEvent.clear(bio);
    await userEvent.type(bio, "Nueva biografía");
    await userEvent.click(screen.getByRole("button", { name: "Comedia" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/profile/ana.nueva"));
    expect(apiFetch).toHaveBeenNthCalledWith(3, "/usuarios/u1/perfil", {
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
    vi.mocked(apiFetch).mockImplementation(async (ruta) => {
      if (ruta === "/contenidos/generos") return GENEROS as never;
      if (ruta === "/auth/csrf") return { csrf_token: "csrf-prueba" } as never;
      throw new Error("fallo");
    });
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
