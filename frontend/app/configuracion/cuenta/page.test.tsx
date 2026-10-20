import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerSesion } from "@/features/auth/session";
import ConfiguracionCuentaPage from "./page";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

vi.mock("@/features/landing", () => ({
  LandingHeader: () => <header>Cabecera</header>,
  LandingFooter: () => <footer>Pie</footer>,
}));

vi.mock("@/features/profile/components/account-settings", () => ({
  AccountSettings: ({ email }: { email: string }) => <div>{email}</div>,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("ConfiguracionCuentaPage", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(obtenerSesion).mockReset();
  });

  it("redirige al login si no hay sesión", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    await expect(ConfiguracionCuentaPage()).rejects.toThrow("NEXT_REDIRECT");
  });

  it("muestra la configuración privada de la cuenta autenticada", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "u1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      foto_url: null,
    });

    render(await ConfiguracionCuentaPage());

    expect(
      screen.getByRole("heading", { name: "Configuración de la cuenta" })
    ).toBeTruthy();
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });
});
