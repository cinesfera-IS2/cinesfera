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

    // Una en la barra de escritorio y otra en el menú móvil; el CSS muestra una sola.
    for (const acceder of screen.getAllByRole("link", { name: "Acceder" })) {
      expect(acceder.getAttribute("href")).toBe("/login");
    }
    expect(screen.queryByRole("button", { name: "Cerrar sesión" })).toBeNull();
  });

  it("el menú principal lleva a tendencias, comunidad y soporte", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(await LandingHeader());

    const destinos = { Tendencias: "/tendencias", Comunidad: "/comunidad", Soporte: "/soporte" };
    for (const [nombre, href] of Object.entries(destinos)) {
      for (const enlace of screen.getAllByRole("link", { name: nombre })) {
        expect(enlace.getAttribute("href")).toBe(href);
      }
    }
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

    for (const perfil of screen.getAllByRole("link", { name: "Mi perfil" })) {
      expect(perfil.getAttribute("href")).toBe("/profile/anatorres");
    }
    expect(screen.getAllByRole("button", { name: "Cerrar sesión" })).not.toHaveLength(0);
    expect(screen.queryByRole("link", { name: "Acceder" })).toBeNull();
  });
});
