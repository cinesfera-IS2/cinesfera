import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfileDetails } from "./profile-details";
import type { PerfilPublico } from "@/features/profile/types";

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "Ana",
  apellido: "Torres",
  email: "ana@example.com",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  ubicacion: "Montevideo, Uruguay",
  generosFavoritos: ["Thriller", "Drama"],
  estadisticas: { resenas: 0, vistas: 0, seguidores: 0, siguiendo: 0 },
};

function etiquetas() {
  return Array.from(document.querySelectorAll("dt")).map(
    (dt) => dt.firstChild?.textContent
  );
}

describe("ProfileDetails", () => {
  afterEach(cleanup);

  it("muestra el nombre completo, la antigüedad y la ubicación", () => {
    render(<ProfileDetails perfil={PERFIL} esPropio={false} />);

    expect(screen.getByText("Ana Torres")).toBeTruthy();
    expect(screen.getByText("febrero de 2026")).toBeTruthy();
    expect(screen.getByText("Montevideo, Uruguay")).toBeTruthy();
  });

  it("sin ubicación no deja el dato vacío", () => {
    render(
      <ProfileDetails perfil={{ ...PERFIL, ubicacion: undefined }} esPropio={false} />
    );

    expect(etiquetas()).toEqual(["Nombre completo", "Miembro desde"]);
  });

  it("no muestra el email en un perfil ajeno", () => {
    render(<ProfileDetails perfil={PERFIL} esPropio={false} />);

    expect(screen.queryByText("ana@example.com")).toBeNull();
  });

  it("muestra el email en el perfil propio, aclarando que es privado", () => {
    render(<ProfileDetails perfil={PERFIL} esPropio />);

    expect(screen.getByText("ana@example.com")).toBeTruthy();
    expect(screen.getByText("Solo vos")).toBeTruthy();
  });

  it("lista los géneros favoritos solo si hay alguno", () => {
    render(<ProfileDetails perfil={PERFIL} esPropio={false} />);
    expect(
      screen.getAllByRole("listitem").map((genero) => genero.textContent)
    ).toEqual(["Thriller", "Drama"]);

    cleanup();
    render(
      <ProfileDetails perfil={{ ...PERFIL, generosFavoritos: [] }} esPropio={false} />
    );
    expect(screen.queryByRole("heading", { name: "Géneros favoritos" })).toBeNull();
  });
});
