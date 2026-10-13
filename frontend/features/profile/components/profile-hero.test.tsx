import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProfileHero } from "./profile-hero";
import type { PerfilPublico } from "@/features/profile/types";

const PERFIL: PerfilPublico = {
  id: "u1",
  nombreUsuario: "anatorres",
  nombre: "ana",
  apellido: "torres",
  rol: "usuario",
  fechaRegistro: "2026-02-14",
  bio: "Fan de los thrillers.",
  generosFavoritos: [],
  estadisticas: { resenas: 12, vistas: 1340, seguidores: 5, siguiendo: 3 },
};

describe("ProfileHero", () => {
  afterEach(cleanup);

  it("presenta a la persona con su usuario, antigüedad y bio", () => {
    render(<ProfileHero perfil={PERFIL} esPropio={false} />);

    expect(screen.getByRole("heading", { level: 1, name: "ana torres" })).toBeTruthy();
    expect(screen.getByText("@anatorres")).toBeTruthy();
    expect(screen.getByText("Miembro desde febrero de 2026")).toBeTruthy();
    expect(screen.getByText("Fan de los thrillers.")).toBeTruthy();
  });

  it("muestra las estadísticas con separador de miles", () => {
    render(<ProfileHero perfil={PERFIL} esPropio={false} />);

    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("1.340")).toBeTruthy();
  });

  it("sin foto usa las iniciales en mayúscula", () => {
    render(<ProfileHero perfil={PERFIL} esPropio={false} />);

    expect(screen.getByText("AT")).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Foto de/ })).toBeNull();
  });

  it("con foto muestra la imagen en lugar de las iniciales", () => {
    render(
      <ProfileHero perfil={{ ...PERFIL, fotoUrl: "/fotos/ana.jpg" }} esPropio={false} />
    );

    expect(screen.getByRole("img", { name: "Foto de ana torres" })).toBeTruthy();
    expect(screen.queryByText("AT")).toBeNull();
  });

  it("en un perfil ajeno ofrece seguir", () => {
    render(<ProfileHero perfil={PERFIL} esPropio={false} />);

    expect(screen.getByRole("button", { name: "Seguir" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar perfil" })).toBeNull();
  });

  it("en el perfil propio ofrece editarlo", () => {
    render(<ProfileHero perfil={PERFIL} esPropio />);

    expect(screen.getByRole("button", { name: "Editar perfil" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Seguir" })).toBeNull();
  });

  it("distingue a los administradores y omite la bio si no hay", () => {
    render(
      <ProfileHero perfil={{ ...PERFIL, rol: "admin", bio: undefined }} esPropio={false} />
    );

    expect(screen.getByText("Equipo Cinesfera")).toBeTruthy();
    expect(screen.queryByText("Fan de los thrillers.")).toBeNull();
  });
});
