import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NavegacionCatalogo } from "@/features/catalog/components/navegacion-catalogo";

import { BuscadorPerfiles } from "./buscador-perfiles";

const pushMock = vi.fn();
let busqueda = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => busqueda,
}));

// next/form necesita el router de la app; acá alcanza con un form que avise el envío.
vi.mock("next/form", () => ({
  default: ({ action, role, onSubmit, children }: React.ComponentProps<"form">) => (
    <form action={action as string} role={role} onSubmit={onSubmit}>
      {children}
    </form>
  ),
}));

describe("BuscadorPerfiles", () => {
  afterEach(() => {
    cleanup();
    pushMock.mockReset();
    busqueda = new URLSearchParams();
  });

  it("muestra la búsqueda que trae la URL", () => {
    busqueda = new URLSearchParams("q=@AnaTorres");

    render(<BuscadorPerfiles />);

    expect(screen.getByLabelText<HTMLInputElement>("Buscar perfiles").value).toBe(
      "anatorres"
    );
  });

  it("al buscar navega con el nombre normalizado, sin mover el scroll", () => {
    render(
      <NavegacionCatalogo>
        <BuscadorPerfiles />
      </NavegacionCatalogo>
    );

    fireEvent.change(screen.getByLabelText("Buscar perfiles"), {
      target: { value: " @Ana " },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/comunidad?q=ana", { scroll: false });
  });
});
