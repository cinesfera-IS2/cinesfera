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

function tipoElegido() {
  return (screen.getAllByRole("radio") as HTMLInputElement[]).find(
    (opcion) => opcion.checked
  )?.value;
}

describe("BuscadorCatalogo", () => {
  afterEach(cleanup);

  it("arranca con los campos vacíos y los valores por defecto", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(
      campo<HTMLInputElement>("Buscar películas y series por título").value
    ).toBe("");
    expect(tipoElegido()).toBe("");
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
    expect(tipoElegido()).toBe("serie");
    expect(campo<HTMLInputElement>("Año de estreno").value).toBe("1999");
  });

  it("ofrece los tres tipos a la vista", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(screen.getByRole("group", { name: "Tipo" })).toBeTruthy();
    expect(screen.getAllByRole("radio").map((opcion) => opcion.closest("label")?.textContent))
      .toEqual(["Todo", "Películas", "Series"]);
  });

  it("no muestra los filtros que el backend todavía no soporta", () => {
    render(<BuscadorCatalogo filtros={FILTROS} />);

    expect(screen.queryByLabelText("Ordenar por")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Géneros" })).toBeNull();
  });
});
