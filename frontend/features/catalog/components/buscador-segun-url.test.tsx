import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BuscadorSegunUrl } from "./buscador-segun-url";
import { NavegacionCatalogo } from "./navegacion-catalogo";

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

describe("BuscadorSegunUrl", () => {
  afterEach(() => {
    cleanup();
    pushMock.mockReset();
    busqueda = new URLSearchParams();
  });

  it("muestra los filtros que trae la URL", () => {
    busqueda = new URLSearchParams("q=matrix&tipo=serie&anio=1999");

    render(<BuscadorSegunUrl />);

    expect(screen.getByLabelText<HTMLInputElement>("Buscar películas y series por título").value).toBe("matrix");
    expect(screen.getByLabelText<HTMLInputElement>("Año de estreno").value).toBe("1999");
  });

  it("al buscar navega con la URL limpia, sin mover el scroll", () => {
    render(
      <NavegacionCatalogo>
        <BuscadorSegunUrl />
      </NavegacionCatalogo>
    );

    fireEvent.change(screen.getByLabelText("Buscar películas y series por título"), {
      target: { value: "  dark " },
    });
    fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).toHaveBeenCalledWith("/catalogo?q=dark", { scroll: false });
  });

  it("fuera del catálogo deja que el formulario se envíe solo", () => {
    render(<BuscadorSegunUrl />);

    const enviado = fireEvent.submit(screen.getByRole("search"));

    expect(pushMock).not.toHaveBeenCalled();
    expect(enviado).toBe(true);
  });
});
