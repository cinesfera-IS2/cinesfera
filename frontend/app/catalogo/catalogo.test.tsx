import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CatalogoLayout from "./layout";
import CargandoCatalogo from "./loading";
import CatalogoPage from "./page";

vi.mock("@/features/landing", () => ({
  LandingHeader: () => <header>Cabecera</header>,
  LandingFooter: () => <footer>Pie</footer>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("q=matrix"),
}));

vi.mock("next/form", () => ({
  default: ({ role, children }: React.ComponentProps<"form">) => (
    <form role={role}>{children}</form>
  ),
}));

describe("ruta /catalogo", () => {
  afterEach(cleanup);

  it("la página traduce la URL a filtros para los resultados", async () => {
    const pagina = await CatalogoPage({
      searchParams: Promise.resolve({ q: "matrix", pagina: "2" }),
    } as never);

    expect(pagina.props.filtros).toMatchObject({ texto: "matrix", pagina: 2 });
  });

  it("mientras carga muestra el esqueleto de resultados", () => {
    render(<CargandoCatalogo />);

    expect(screen.getByLabelText("Cargando catálogo").getAttribute("aria-busy")).toBe("true");
  });

  it("el layout mantiene cabecera, buscador y pie alrededor de los resultados", () => {
    render(
      <CatalogoLayout params={Promise.resolve({})}>
        <p>Resultados</p>
      </CatalogoLayout>
    );

    expect(screen.getByRole("heading", { name: "Catálogo" })).toBeTruthy();
    expect(screen.getByRole("search")).toBeTruthy();
    expect(screen.getByLabelText<HTMLInputElement>("Buscar películas y series por título").value).toBe("matrix");
    expect(screen.getByText("Resultados")).toBeTruthy();
    expect(screen.getByText("Cabecera")).toBeTruthy();
    expect(screen.getByText("Pie")).toBeTruthy();
  });
});
