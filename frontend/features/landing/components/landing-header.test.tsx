import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerSesion } from "@/features/auth/session";

import { LandingHeader } from "./landing-header";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

describe("LandingHeader", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(obtenerSesion).mockReset();
  });

  it("sin sesión ofrece acceder", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(await LandingHeader());

    expect(
      screen.getByRole("link", { name: "Acceder" }).getAttribute("href")
    ).toBe("/login");
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
  });

  it("con sesión lleva al perfil propio y permite cerrarla", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "u1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      foto_url: null,
    });

    render(await LandingHeader());

    expect(
      screen.getByRole("link", { name: "Mi perfil" }).getAttribute("href")
    ).toBe("/profile/anatorres");
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Acceder" })).toBeNull();
  });
});
