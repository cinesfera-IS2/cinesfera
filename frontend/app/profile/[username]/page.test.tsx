import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PerfilNoEncontrado from "./not-found";
import ProfilePage, { generateMetadata } from "./page";
import { obtenerSesion, type UsuarioSesion } from "@/features/auth/session";
import { obtenerPerfilPublico } from "@/features/profile";
import type { PerfilPublico } from "@/features/profile/types";

vi.mock("@/features/auth/session", () => ({ obtenerSesion: vi.fn() }));

// La cabecera resuelve la sesión con cookies() de Next, que fuera de un
// request no existe; la de verdad se prueba aparte.
vi.mock("@/features/landing", () => ({
  LandingHeader: () => <header>Cabecera</header>,
  LandingFooter: () => <footer>Pie</footer>,
}));

vi.mock("@/features/profile", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  obtenerPerfilPublico: vi.fn(),
}));

// notFound() de Next corta el render lanzando un error; acá se imita igual.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "Ana",
  apellido: "Torres",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  bio: "Fan de los thrillers.",
  generosFavoritos: [],
  estadisticas: { resenas: 0, vistas: 0, seguidores: 0, siguiendo: 0 },
};

const SESION_PROPIA: UsuarioSesion = {
  id: "u1",
  nombre: "Ana",
  apellido: "Torres",
  nombre_usuario: "anatorres",
  email: "ana@example.com",
  foto_url: null,
};

function props(username: string) {
  return { params: Promise.resolve({ username }) } as PageProps<"/profile/[username]">;
}

function simularPerfil(perfil: PerfilPublico | null) {
  vi.mocked(obtenerPerfilPublico).mockResolvedValue(
    perfil && { perfil, resenas: [] }
  );
}

describe("página de perfil", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(obtenerPerfilPublico).mockReset();
    vi.mocked(obtenerSesion).mockReset();
  });

  it("titula la pestaña con el nombre y usa la bio como descripción", async () => {
    simularPerfil(PERFIL);

    expect(await generateMetadata(props("anatorres"))).toEqual({
      title: "Ana Torres (@anatorres) — Cinesfera",
      description: "Fan de los thrillers.",
    });
    expect(obtenerPerfilPublico).toHaveBeenCalledWith("anatorres");
  });

  it("sin bio arma una descripción genérica", async () => {
    simularPerfil({ ...PERFIL, bio: undefined });

    const metadata = await generateMetadata(props("anatorres"));

    expect(metadata.description).toBe("Mirá las reseñas de Ana Torres en Cinesfera.");
  });

  it("avisa en el título cuando el perfil no existe", async () => {
    simularPerfil(null);

    expect(await generateMetadata(props("nadie"))).toEqual({
      title: "Perfil no encontrado — Cinesfera",
    });
  });

  it("muestra el perfil como visitante", async () => {
    simularPerfil(PERFIL);
    vi.mocked(obtenerSesion).mockResolvedValue(null);

    render(await ProfilePage(props("anatorres")));

    expect(screen.getByRole("heading", { level: 1, name: "Ana Torres" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Seguir" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Ana no publicó reseñas" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar perfil" })).toBeNull();
  });

  it("con la sesión de otra persona sigue viéndose como visitante", async () => {
    simularPerfil(PERFIL);
    vi.mocked(obtenerSesion).mockResolvedValue({
      ...SESION_PROPIA,
      id: "otra",
      nombre_usuario: "otra",
      email: "otra@example.com",
    });

    render(await ProfilePage(props("anatorres")));

    expect(screen.getByRole("button", { name: "Seguir" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar perfil" })).toBeNull();
    expect(screen.queryByText("otra@example.com")).toBeNull();
  });

  it("en el perfil propio ofrece editarlo y muestra el email", async () => {
    simularPerfil(PERFIL);
    vi.mocked(obtenerSesion).mockResolvedValue(SESION_PROPIA);

    render(await ProfilePage(props("anatorres")));

    expect(screen.getByRole("button", { name: "Editar perfil" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Seguir" })).toBeNull();
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });

  it("responde con not-found cuando el perfil no existe", async () => {
    simularPerfil(null);

    await expect(ProfilePage(props("nadie"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("la página de no encontrado ofrece volver al inicio", () => {
    render(<PerfilNoEncontrado />);

    expect(
      screen.getByRole("heading", { name: "No encontramos ese perfil" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Volver al inicio" }).getAttribute("href")
    ).toBe("/");
  });
});
