import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ReviewCard } from "./review-card";
import type { ResenaPerfil } from "@/features/profile/types";

const RESENA: ResenaPerfil = {
  id: "r1",
  titulo: "Matrix",
  puntaje: 3.5,
  fecha: "2026-09-04",
  comentario: "Sigue siendo increíble.",
  posterGradient: "",
};

describe("ReviewCard", () => {
  afterEach(cleanup);

  it("muestra el título, el puntaje, la fecha y el comentario", () => {
    render(<ReviewCard resena={RESENA} />);

    expect(screen.getByRole("heading", { name: "Matrix" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "3.5 de 5 estrellas" })).toBeTruthy();
    expect(screen.getByText("4 de septiembre de 2026").getAttribute("datetime")).toBe(
      "2026-09-04"
    );
    expect(screen.getByText("Sigue siendo increíble.")).toBeTruthy();
  });

  it("agrega el año y los me gusta solo cuando los hay", () => {
    render(<ReviewCard resena={{ ...RESENA, anio: 1999, meGusta: 7 }} />);

    expect(screen.getByRole("heading").textContent).toMatch(/^Matrix\s+\(1999\)$/);
    expect(screen.getByText("7 me gusta")).toBeTruthy();
  });

  it("sin año ni me gusta no muestra esos datos", () => {
    render(<ReviewCard resena={RESENA} />);

    expect(screen.queryByText(/\(\d{4}\)/)).toBeNull();
    expect(screen.queryByText(/me gusta/)).toBeNull();
  });
});
