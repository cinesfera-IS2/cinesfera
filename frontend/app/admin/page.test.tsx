import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obtenerSesion } from "@/features/auth/session";
import AdminPage from "./page";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));
vi.mock("@/features/admin", () => ({
  AdminPanel: ({ sesion }: { sesion: { nombre_usuario: string } }) => (
    <div>Panel de {sesion.nombre_usuario}</div>
  ),
}));
vi.mock("@/features/landing", () => ({
  LandingHeader: () => <header>Cabecera</header>,
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));

afterEach(() => {
  cleanup();
  vi.mocked(obtenerSesion).mockReset();
});

describe("AdminPage", () => {
  it("redirige al login cuando no hay sesión", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);
    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirige al catálogo cuando la cuenta no es administrativa", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "usuario-1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "ana",
      email: "ana@example.com",
      foto_url: null,
      rol: "usuario",
    });

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT:/catalogo");
  });

  it("renderiza el panel para una cuenta administrativa", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "admin-1",
      nombre: "Ada",
      apellido: "Admin",
      nombre_usuario: "ada.admin",
      email: "ada@example.com",
      foto_url: null,
      rol: "admin",
      es_admin_principal: true,
    });

    render(await AdminPage());

    expect(screen.getByText("Cabecera")).toBeTruthy();
    expect(screen.getByText("Panel de ada.admin")).toBeTruthy();
  });
});
