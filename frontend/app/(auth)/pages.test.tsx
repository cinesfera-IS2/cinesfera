import { cleanup, render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import { obtenerSesion } from "@/features/auth/session";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

// La cartelera pide pósters al backend; acá no interesa.
vi.mock("@/features/auth/components/cartelera", () => ({
  Cartelera: () => null,
  CarteleraEsqueleto: () => null,
}));

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

    render(await Pagina({ searchParams: Promise.resolve({}) } as never));

    expect(screen.getByRole("heading", { name: titulo })).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("si viene de otra página, Volver lleva ahí y el texto lo aclara", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(
      await Pagina({ searchParams: Promise.resolve({ volver: "/content/pelicula/603" }) } as never)
    );

    expect(screen.getByRole("link", { name: "Volver" }).getAttribute("href")).toBe(
      "/content/pelicula/603"
    );
    expect(screen.getByText(/seguí donde estabas|seguir donde estabas/)).toBeTruthy();
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

    await expect(Pagina({ searchParams: Promise.resolve({}) } as never)).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/catalogo");
  });

  it("con sesión y una página de origen vuelve a ella", async () => {
    vi.mocked(obtenerSesion).mockResolvedValue({
      id: "u1",
      nombre: "Ana",
      apellido: "Torres",
      nombre_usuario: "anatorres",
      email: "ana@example.com",
      foto_url: null,
    });

    await expect(
      Pagina({ searchParams: Promise.resolve({ volver: "/content/pelicula/603" }) } as never)
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/content/pelicula/603");
  });
});
