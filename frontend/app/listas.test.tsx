import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obrasDestacadas, obrasEnTendencia } from "@/features/catalog";

import JoyasLayout from "./joyas/layout";
import CargandoJoyas from "./joyas/loading";
import JoyasPage from "./joyas/page";
import TendenciasLayout from "./tendencias/layout";
import CargandoTendencias from "./tendencias/loading";
import TendenciasPage from "./tendencias/page";

vi.mock("@/features/catalog", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/catalog")>();
  return { ...original, obrasDestacadas: vi.fn(), obrasEnTendencia: vi.fn() };
});

vi.mock("@/features/landing/components/landing-header", () => ({
  LandingHeader: () => <header>Cabecera</header>,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const LISTAS = [
  { ruta: "/joyas", titulo: "Joyas de la cartelera", Layout: JoyasLayout, Cargando: CargandoJoyas, Page: JoyasPage, pedir: obrasDestacadas },
  { ruta: "/tendencias", titulo: "Tendencias de la semana", Layout: TendenciasLayout, Cargando: CargandoTendencias, Page: TendenciasPage, pedir: obrasEnTendencia },
];

describe.each(LISTAS)("ruta $ruta", ({ ruta, titulo, Layout, Cargando, Page, pedir }) => {
  afterEach(() => {
    cleanup();
    vi.mocked(pedir).mockReset();
  });

  it("pide la página de la URL y la muestra paginada", async () => {
    const lista = { obras: [], pagina: 4, totalPaginas: 500 };
    vi.mocked(pedir).mockResolvedValue(lista);

    const pagina = await Page({ searchParams: Promise.resolve({ pagina: "4" }) } as never);

    expect(pedir).toHaveBeenCalledWith(4);
    expect(pagina.props).toEqual({ pagina: lista, ruta });
  });

  it("si TMDB no responde, la página lo explica", async () => {
    vi.mocked(pedir).mockRejectedValue(new Error("Error 503"));

    render(await Page({ searchParams: Promise.resolve({}) } as never));

    expect(screen.getByText(/No pudimos cargar esta lista/)).toBeTruthy();
  });

  it("el layout presenta la lista con su título", () => {
    render(
      <Layout params={Promise.resolve({})}>
        <p>Obras</p>
      </Layout>
    );

    expect(screen.getByRole("heading", { level: 1, name: titulo })).toBeTruthy();
    expect(screen.getByText("Obras")).toBeTruthy();
    expect(screen.getByText("Cabecera")).toBeTruthy();
  });

  it("mientras carga muestra el esqueleto", () => {
    render(<Cargando />);

    expect(screen.getByLabelText("Cargando catálogo").getAttribute("aria-busy")).toBe("true");
  });
});
