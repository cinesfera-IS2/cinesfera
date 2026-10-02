import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { StarRating } from "./star-rating";

function estrellas() {
  const iconos = Array.from(
    screen.getByRole("img").querySelectorAll("svg")
  );
  const llenas = iconos.filter((icono) => icono.classList.contains("text-glow-400"));
  return { total: iconos.length, llenas: llenas.length };
}

describe("StarRating", () => {
  afterEach(cleanup);

  it("describe el puntaje para lectores de pantalla", () => {
    render(<StarRating puntaje={4} />);

    expect(screen.getByRole("img", { name: "4 de 5 estrellas" })).toBeTruthy();
  });

  it.each([
    [0, 0],
    [2.5, 3],
    [5, 5],
  ])("con %s pinta %s estrellas (las medias cuentan)", (puntaje, pintadas) => {
    render(<StarRating puntaje={puntaje} />);

    expect(estrellas()).toEqual({ total: 5, llenas: pintadas });
  });
});
