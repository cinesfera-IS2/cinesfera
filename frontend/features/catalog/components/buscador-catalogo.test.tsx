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
    expect(campo<HTMLInputElement>("Año de estreno").value).toBe("");
  });

  it("muestra los filtros que vienen de la URL", () => {
    render(
      <BuscadorCatalogo
        filtros={{
          ...FILTROS,
          texto: "matrix",
          tipo: "serie",
          anioEstreno: 1999,
        }}
      />
    );

    expect(
      campo<HTMLInputElement>("Buscar películas y series por título").value
    ).toBe("matrix");
    expect(campo<HTMLSelectElement>("Tipo").value).toBe("serie");
    expect(campo<HTMLInputElement>("Año de estreno").value).toBe("1999");
  });

  it("no muestra los filtros que el backend todavía no soporta", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(screen.queryByLabelText("Ordenar por")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Géneros" })).toBeNull();
  });
});
