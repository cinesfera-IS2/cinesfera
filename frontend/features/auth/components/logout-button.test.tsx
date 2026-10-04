import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cerrarSesion } from "@/features/auth/lib/cerrar-sesion";

import { LogoutButton } from "./logout-button";

vi.mock("@/features/auth/lib/cerrar-sesion", () => ({ cerrarSesion: vi.fn() }));

describe("LogoutButton", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(cerrarSesion).mockReset();
  });

  it("cierra la sesión y queda deshabilitado mientras recarga", async () => {
    vi.mocked(cerrarSesion).mockResolvedValue();
    render(<LogoutButton />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "Cerrar sesión" })
    );

    expect(cerrarSesion).toHaveBeenCalledOnce();
    expect(
      screen.getByRole<HTMLButtonElement>("button", { name: "Cerrar sesión" })
        .disabled
    ).toBe(true);
  });

  it("si falla, avisa y permite reintentar", async () => {
    vi.mocked(cerrarSesion).mockRejectedValue(new Error("Error 500"));
    render(<LogoutButton />);

    await userEvent.setup().click(
      screen.getByRole("button", { name: "Cerrar sesión" })
    );

    const boton = await screen.findByTitle(
      "No pudimos cerrar la sesión. Probá de nuevo."
    );
    expect((boton as HTMLButtonElement).disabled).toBe(false);
  });
});
