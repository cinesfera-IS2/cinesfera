import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BuscadorCatalogo } from "./buscador-catalogo";
import type { FiltrosCatalogo } from "@/features/catalog/types";

// next/form necesita el router de la app, que no existe fuera de Next.
vi.mock("next/form", () => ({
  default: ({ action, role, children }: React.ComponentProps<"form">) => (
    <form action={action} role={role}>
      {children}
    </form>
  ),
}));

const FILTROS: FiltrosCatalogo = { orden: "populares", pagina: 1 };

function campo<T extends HTMLElement>(etiqueta: string) {
  return screen.getByLabelText(etiqueta) as T;
}

describe("BuscadorCatalogo", () => {
  afterEach(cleanup);

  it("arranca con los campos vacíos y los valores por defecto", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(
      campo<HTMLInputElement>("Buscar películas y series por título").value
    ).toBe("");
    expect(campo<HTMLSelectElement>("Tipo").value).toBe("");
    expect(campo<HTMLSelectElement>("Ordenar por").value).toBe("populares");
    expect(campo<HTMLInputElement>("Año de estreno").value).toBe("");
  });

  it("muestra los filtros que vienen de la URL", () => {
    render(
      <BuscadorCatalogo
        filtros={{
          ...FILTROS,
          texto: "matrix",
          tipo: "serie",
          orden: "recientes",
          anioEstreno: 1999,
        }}
      />
    );

    expect(
      campo<HTMLInputElement>("Buscar películas y series por título").value
    ).toBe("matrix");
    expect(campo<HTMLSelectElement>("Tipo").value).toBe("serie");
    expect(campo<HTMLSelectElement>("Ordenar por").value).toBe("recientes");
    expect(campo<HTMLInputElement>("Año de estreno").value).toBe("1999");
  });

  it("conserva el género elegido al volver a buscar", () => {
    const { container } = render(
      <BuscadorCatalogo filtros={{ ...FILTROS, genero: "drama" }} />
    );

    const oculto = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="genero"]'
    );
    expect(oculto?.value).toBe("drama");
  });

  it("sin género elegido no manda el campo oculto", () => {
    const { container } = render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(container.querySelector('input[name="genero"]')).toBeNull();
  });

  it("marca el chip 'Todos' cuando no hay género", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    const todos = screen.getByRole("link", { name: "Todos" });
    expect(todos.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "Drama" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("los chips cambian el género, mantienen la búsqueda y vuelven a la primera página", () => {
    render(
      <BuscadorCatalogo
        filtros={{ ...FILTROS, texto: "la", genero: "drama", pagina: 3 }}
      />
    );

    expect(
      screen.getByRole("link", { name: "Drama" }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Comedia" }).getAttribute("href")
    ).toBe("/catalogo?q=la&genero=comedia");
    expect(screen.getByRole("link", { name: "Todos" }).getAttribute("href")).toBe(
      "/catalogo?q=la"
    );
  });
});
