import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ProfileSections } from "./profile-sections";
import type { ResenaPerfil } from "@/features/profile/types";

function resena(datos: Partial<ResenaPerfil> & Pick<ResenaPerfil, "id">): ResenaPerfil {
  return {
    titulo: datos.id,
    puntaje: 4,
    fecha: "2026-09-04",
    comentario: `Comentario ${datos.id}`,
    posterGradient: "",
    ...datos,
  };
}

describe("ProfileSections", () => {
  afterEach(cleanup);

  it("lista las reseñas y muestra cuántas hay en la pestaña", () => {
    render(
      <ProfileSections
        resenas={[resena({ id: "Matrix" }), resena({ id: "Dune" })]}
        nombre="Ana"
        esPropio={false}
      />
    );

    const pestana = screen.getByRole("tab", { name: /Reseñas/ });
    expect(pestana.getAttribute("aria-selected")).toBe("true");
    expect(pestana.textContent).toContain("2");
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(
      pestana.id
    );
  });

  it("sigue mostrando las reseñas al volver a elegir la pestaña", async () => {
    render(
      <ProfileSections resenas={[resena({ id: "Matrix" })]} nombre="Ana" esPropio={false} />
    );

    await userEvent.click(screen.getByRole("tab", { name: /Reseñas/ }));

    expect(screen.getByRole("heading", { name: "Matrix" })).toBeTruthy();
  });

  it("sin reseñas ajenas avisa con el nombre de la persona", () => {
    render(<ProfileSections resenas={[]} nombre="Ana" esPropio={false} />);

    expect(
      screen.getByRole("heading", { name: "Ana no publicó reseñas" })
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Escribir una reseña/ })).toBeNull();
    expect(screen.getByRole("tab", { name: "Reseñas" })).toBeTruthy();
  });

  it("sin reseñas propias invita a escribir la primera", () => {
    render(<ProfileSections resenas={[]} nombre="Ana" esPropio />);

    expect(
      screen.getByRole("heading", { name: "Todavía no escribiste reseñas" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Escribir una reseña/ })).toBeTruthy();
  });
});
