import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buscarPerfil } from "@/features/profile";
import type { PerfilPublico } from "@/features/profile/types";

import { ResultadoBusqueda } from "./resultado-busqueda";

vi.mock("@/features/profile", () => ({ buscarPerfil: vi.fn() }));

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "Ana",
  apellido: "Torres",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  bio: "Fan del cine independiente",
  generosFavoritos: [],
  estadisticas: { resenas: 1, seguidores: 8, siguiendo: 3 },
};

describe("ResultadoBusqueda", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(buscarPerfil).mockReset();
  });

  it("sin consulta invita a buscar y no le pregunta al backend", async () => {
    render(await ResultadoBusqueda({ consulta: "" }));

    expect(screen.getByRole("heading", { name: "Encontrá a otros cinéfilos" })).toBeTruthy();
    expect(buscarPerfil).not.toHaveBeenCalled();
  });

  it("muestra el perfil encontrado con enlace a su página", async () => {
    vi.mocked(buscarPerfil).mockResolvedValue(PERFIL);

    render(await ResultadoBusqueda({ consulta: "anatorres" }));

    expect(buscarPerfil).toHaveBeenCalledWith("anatorres");
    const enlace = screen.getByRole("link");
    expect(enlace.getAttribute("href")).toBe("/profile/anatorres");
    expect(enlace.textContent).toContain("Ana Torres");
    expect(enlace.textContent).toContain("1 reseña");
    expect(enlace.textContent).toContain("8 seguidores");
  });

  it("avisa cuando no existe nadie con ese nombre", async () => {
    vi.mocked(buscarPerfil).mockResolvedValue(null);

    render(await ResultadoBusqueda({ consulta: "nadie" }));

    expect(screen.getByRole("heading", { name: "No encontramos a @nadie" })).toBeTruthy();
  });

  it("un nombre imposible ni siquiera se consulta", async () => {
    render(await ResultadoBusqueda({ consulta: "a b" }));

    expect(buscarPerfil).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "No encontramos a @a b" })).toBeTruthy();
  });

  it("si el backend falla lo dice en lugar de romper la página", async () => {
    vi.mocked(buscarPerfil).mockRejectedValue(new Error("caído"));

    render(await ResultadoBusqueda({ consulta: "anatorres" }));

    expect(screen.getByRole("heading", { name: "No pudimos buscar ahora" })).toBeTruthy();
  });
});
