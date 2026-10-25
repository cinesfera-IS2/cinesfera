import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { use, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnlaceCatalogo, NavegacionCatalogo, ResultadosPendientes } from "./navegacion-catalogo";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

// Imita a next/link: avisa la navegación y respeta si se la cancela.
vi.mock("next/link", () => ({
  default: ({
    href,
    onNavigate,
    children,
    ...props
  }: React.ComponentProps<"a"> & {
    href: string;
    scroll?: boolean;
    onNavigate?: (evento: { preventDefault: () => void }) => void;
  }) => (
    <a
      href={href}
      {...{ ...props, scroll: undefined }}
      onClick={(evento) => {
        evento.preventDefault();
        let cancelada = false;
        onNavigate?.({ preventDefault: () => (cancelada = true) });
        if (!cancelada) pushMock(href, { navegacionNativa: true });
      }}
    >
      {children}
    </a>
  ),
}));

describe("navegación del catálogo", () => {
  afterEach(() => {
    cleanup();
    pushMock.mockReset();
  });

  it("dentro del catálogo el enlace navega por la transición, respetando el scroll", async () => {
    render(
      <NavegacionCatalogo>
        <EnlaceCatalogo href="/catalogo?pagina=2" scroll={false}>
          Siguiente
        </EnlaceCatalogo>
      </NavegacionCatalogo>
    );

    await userEvent.setup().click(screen.getByRole("link", { name: "Siguiente" }));

    expect(pushMock).toHaveBeenCalledWith("/catalogo?pagina=2", { scroll: false });
  });

  it("sin indicar scroll vuelve arriba al navegar", async () => {
    render(
      <NavegacionCatalogo>
        <EnlaceCatalogo href="/catalogo?pagina=3">Página 3</EnlaceCatalogo>
      </NavegacionCatalogo>
    );

    await userEvent.setup().click(screen.getByRole("link", { name: "Página 3" }));

    expect(pushMock).toHaveBeenCalledWith("/catalogo?pagina=3", { scroll: true });
  });

  it("fuera del catálogo es un enlace común", async () => {
    render(<EnlaceCatalogo href="/catalogo">Catálogo</EnlaceCatalogo>);

    await userEvent.setup().click(screen.getByRole("link", { name: "Catálogo" }));

    expect(pushMock).toHaveBeenCalledWith("/catalogo", { navegacionNativa: true });
  });

  it("mientras carga el destino muestra el esqueleto en lugar de los resultados", async () => {
    const nuncaTermina = new Promise<never>(() => {});

    function Resultados({ ruta }: Readonly<{ ruta: string }>) {
      if (ruta !== "/catalogo") use(nuncaTermina);
      return <EnlaceCatalogo href="/catalogo?q=matrix">Buscar matrix</EnlaceCatalogo>;
    }

    // La ruta vive arriba de los resultados, como en el router de Next.
    function Pagina() {
      const [ruta, setRuta] = useState("/catalogo");
      pushMock.mockImplementation((href: string) => setRuta(href));
      return (
        <NavegacionCatalogo>
          <ResultadosPendientes esqueleto={<p>Cargando catálogo</p>}>
            <Resultados ruta={ruta} />
          </ResultadosPendientes>
        </NavegacionCatalogo>
      );
    }

    render(<Pagina />);
    expect(screen.queryByText("Cargando catálogo")).toBeNull();

    await act(async () => {
      screen.getByRole("link", { name: "Buscar matrix" }).click();
    });

    expect(screen.getByText("Cargando catálogo")).toBeTruthy();
  });
});
