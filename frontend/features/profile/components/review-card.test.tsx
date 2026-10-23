import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReviewCard } from "./review-card";
import type { ResenaPerfil } from "@/features/profile/types";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const RESENA: ResenaPerfil = {
  id: "r1",
  titulo: "Matrix",
  puntaje: 3.5,
  fecha: "2026-09-04",
  comentario: "Sigue siendo increíble.",
  posterUrl: "https://image.tmdb.org/t/p/w500/matrix.jpg",
  posterGradient: "",
  href: "/content/pelicula/603#resena-r1",
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
    expect(
      screen.getByRole("img", { name: "Póster de Matrix" }).getAttribute("src")
    ).toBe("https://image.tmdb.org/t/p/w500/matrix.jpg");
    expect(
      screen
        .getByRole("link", { name: "Ver Matrix y esta reseña" })
        .getAttribute("href")
    ).toBe("/content/pelicula/603#resena-r1");
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
