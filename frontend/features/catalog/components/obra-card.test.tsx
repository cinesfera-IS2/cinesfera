import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ObraCard } from "./obra-card";
import type { Obra } from "@/features/catalog/types";

const OBRA: Obra = {
  id: "matrix",
  tipo: "pelicula",
  titulo: "Matrix",
  fechaEstreno: "1999-03-31",
  generos: ["ciencia-ficcion", "accion"],
  calificacion: 4.4,
  popularidad: 87,
  posterGradient: "from-sky-500/35",
};

describe("ObraCard", () => {
  afterEach(cleanup);

  it("muestra el título, el género principal, el año y la calificación", () => {
    render(<ObraCard obra={{ ...OBRA, calificacion: 4 }} />);

    expect(screen.getByRole("heading", { name: "Matrix" })).toBeTruthy();
    expect(screen.getByText("Ciencia ficción")).toBeTruthy();
    expect(screen.queryByText("Acción")).toBeNull();
    expect(screen.getByText("1999")).toBeTruthy();
    expect(screen.getByText("4.0")).toBeTruthy();
  });

  it("sin póster usa el degradado de respaldo", () => {
    const { container } = render(<ObraCard obra={OBRA} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".from-sky-500\\/35")).not.toBeNull();
  });

  it("con póster muestra la imagen", () => {
    render(<ObraCard obra={{ ...OBRA, poster: "/posters/matrix.jpg" }} />);

    expect(screen.getByRole("img", { name: "Póster de Matrix" })).toBeTruthy();
  });

  it("identifica las series", () => {
    render(<ObraCard obra={{ ...OBRA, tipo: "serie" }} />);

    expect(screen.getByText("Serie")).toBeTruthy();
  });

  it("no marca las películas como serie", () => {
    render(<ObraCard obra={OBRA} />);

    expect(screen.queryByText("Serie")).toBeNull();
  });
});
