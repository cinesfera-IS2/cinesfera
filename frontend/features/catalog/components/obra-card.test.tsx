import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ObraCard } from "./obra-card";
import type { Obra } from "@/features/catalog/types";

const OBRA: Obra = {
  tmdbId: 603,
  tipo: "pelicula",
  titulo: "Matrix",
  fechaEstreno: "1999-03-31",
  posterGradient: "from-sky-500/35",
};

describe("ObraCard", () => {
  afterEach(cleanup);

  it("muestra el título y el año de estreno", () => {
    render(<ObraCard obra={OBRA} />);

    expect(screen.getByRole("heading", { name: "Matrix" })).toBeTruthy();
    expect(screen.getByText("1999")).toBeTruthy();
  });

  it("sin fecha de estreno no muestra el año", () => {
    render(<ObraCard obra={{ ...OBRA, fechaEstreno: null }} />);

    expect(screen.queryByText("1999")).toBeNull();
  });

  it("lleva a la ficha de la obra", () => {
    render(<ObraCard obra={OBRA} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/content/pelicula/603"
    );

    cleanup();
    render(<ObraCard obra={{ ...OBRA, tipo: "serie", tmdbId: 1396 }} />);
    expect(screen.getByRole("link").getAttribute("href")).toBe(
      "/content/serie/1396"
    );
  });

  it("sin póster avisa sobre el degradado de respaldo", () => {
    const { container } = render(<ObraCard obra={OBRA} />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("Portada no disponible")).toBeTruthy();
    expect(container.querySelector(".from-sky-500\\/35")).not.toBeNull();
  });

  it("con póster no muestra el aviso", () => {
    render(<ObraCard obra={{ ...OBRA, poster: "/posters/matrix.jpg" }} />);

    expect(screen.queryByText("Portada no disponible")).toBeNull();
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
