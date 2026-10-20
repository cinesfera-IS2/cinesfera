import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerSesion } from "@/features/auth/session";

import { HeroSection } from "./hero-section";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

describe("HeroSection", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(obtenerSesion).mockReset();
  });

  it("sin sesión invita a registrarse o iniciar sesión", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(await HeroSection());

    expect(
      screen.getByRole("link", { name: "Crear cuenta gratis" }).getAttribute("href")
    ).toBe("/register");
    expect(
      screen.getByRole("link", { name: "Inicia sesión acá" }).getAttribute("href")
    ).toBe("/login");
  });

  it("con sesión solo ofrece explorar el catálogo", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "u1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      foto_url: null,
    });

    render(await HeroSection());

    expect(
      screen.getByRole("link", { name: /Explorar el catálogo/ }).getAttribute("href")
    ).toBe("/catalogo");
    expect(screen.queryByRole("link", { name: "Crear cuenta gratis" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Inicia sesión acá" })).toBeNull();
  });
});
