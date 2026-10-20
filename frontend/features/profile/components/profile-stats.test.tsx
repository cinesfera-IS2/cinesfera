import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { obtenerListaSeguimientos } from "@/features/profile/data/perfiles";
import { ProfileStats } from "./profile-stats";

vi.mock("@/features/profile/data/perfiles", () => ({
  obtenerListaSeguimientos: vi.fn(),
}));

const ESTADISTICAS = {
  resenas: 12,
  seguidores: 5,
  siguiendo: 3,
};

describe("ProfileStats", () => {
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
    vi.clearAllMocks();
  });

  it("abre los seguidores desde su estadística y enlaza sus perfiles", async () => {
    vi.mocked(obtenerListaSeguimientos).mockResolvedValue([
      {
        id: "u2",
        nombre: "Bruno",
        apellido: "Díaz",
        nombreUsuario: "brunod",
      },
    ]);
    render(
      <ProfileStats
        usuarioId="u1"
        estadisticas={ESTADISTICAS}
        esPropio={false}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Ver seguidores" })
    );

    expect(screen.getByRole("dialog", { hidden: true })).toHaveProperty(
      "open",
      true
    );
    expect(obtenerListaSeguimientos).toHaveBeenCalledWith("u1", "seguidores");
    const perfil = await screen.findByRole("link", { name: /Bruno Díaz/ });
    expect(perfil.getAttribute("href")).toBe("/profile/brunod");
  });

  it("permite cambiar a seguidos sin salir del diálogo", async () => {
    vi.mocked(obtenerListaSeguimientos).mockResolvedValue([]);
    render(
      <ProfileStats
        usuarioId="u1"
        estadisticas={ESTADISTICAS}
        esPropio={false}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Ver seguidores" })
    );
    await userEvent.click(screen.getByRole("tab", { name: /seguidos/i }));

    await waitFor(() =>
      expect(obtenerListaSeguimientos).toHaveBeenLastCalledWith("u1", "seguidos")
    );
    expect(
      await screen.findByText("Este perfil todavía no sigue a nadie.")
    ).toBeTruthy();
  });

  it("muestra el error de carga y permite reintentar", async () => {
    vi.mocked(obtenerListaSeguimientos)
      .mockRejectedValueOnce(new Error("red caída"))
      .mockResolvedValueOnce([]);
    render(
      <ProfileStats
        usuarioId="u1"
        estadisticas={ESTADISTICAS}
        esPropio={false}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Ver siguiendo" })
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "No se pudo cargar la lista."
    );

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByText("Este perfil todavía no sigue a nadie.")
    ).toBeTruthy();
    expect(obtenerListaSeguimientos).toHaveBeenCalledTimes(2);
  });

  it("muestra los amigos solo en el perfil propio", async () => {
    const amigos = [
      {
        id: "u2",
        nombre: "Bruno",
        apellido: "Díaz",
        nombreUsuario: "brunod",
      },
    ];
    const { rerender } = render(
      <ProfileStats
        usuarioId="u1"
        estadisticas={ESTADISTICAS}
        esPropio={false}
      />
    );

    expect(screen.queryByRole("button", { name: "Ver amigos" })).toBeNull();

    rerender(
      <ProfileStats
        usuarioId="u1"
        estadisticas={ESTADISTICAS}
        esPropio
        amigosIniciales={amigos}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: "Ver amigos" }));

    expect(screen.getByText("Amigos")).toBeTruthy();
    expect(await screen.findByRole("link", { name: /Bruno Díaz/ })).toBeTruthy();
    expect(obtenerListaSeguimientos).not.toHaveBeenCalledWith("u1", "amigos");
  });
});
