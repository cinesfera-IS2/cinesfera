import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ContentSinopsis } from "./content-sinopsis";

afterEach(cleanup);

describe("ContentSinopsis", () => {
  it("muestra la sinopsis", () => {
    render(<ContentSinopsis sinopsis="Una sinopsis de prueba." />);

    expect(screen.getByRole("heading", { name: "Sinopsis" })).toBeTruthy();
    expect(screen.getByText("Una sinopsis de prueba.")).toBeTruthy();
  });

  it("avisa cuando todavía no hay sinopsis", () => {
    render(<ContentSinopsis sinopsis="" />);

    expect(screen.getByText("La sinopsis todavía no está disponible.")).toBeTruthy();
  });
});
