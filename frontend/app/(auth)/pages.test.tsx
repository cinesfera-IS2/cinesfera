import { cleanup, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import { obtenerSesion } from "@/features/auth/session";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

// redirect() de Next corta el render lanzando un error; acá se imita igual.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

const PAGINAS = [
  { nombre: "login", Pagina: LoginPage, titulo: "Bienvenido de nuevo" },
  { nombre: "registro", Pagina: RegisterPage, titulo: "Creá tu cuenta" },
];

describe.each(PAGINAS)("página de $nombre", ({ Pagina, titulo }) => {
  afterEach(() => {
    cleanup();
    vi.mocked(obtenerSesion).mockReset();
    vi.mocked(redirect).mockClear();
  });

  it("sin sesión muestra el formulario", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(await Pagina());

    expect(screen.getByRole("heading", { name: titulo })).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("con sesión manda al catálogo", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "u1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      foto_url: null,
    });

    await expect(Pagina()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/catalogo");
  });
});
