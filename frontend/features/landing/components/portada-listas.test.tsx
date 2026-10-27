import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { obrasDestacadas, obrasEnTendencia, type Obra } from "@/features/catalog";

import { CarruselEsqueleto, CarruselJoyas, FeaturedSection, JOYAS_EN_PORTADA } from "./featured-section";
import { GrillaEsqueleto, GrillaTendencias, TENDENCIAS_EN_PORTADA, TrendingSection } from "./trending-section";

vi.mock("@/features/catalog", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/catalog")>();
  return { ...original, obrasDestacadas: vi.fn(), obrasEnTendencia: vi.fn() };
});

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

function obra(tmdbId: number, cambios: Partial<Obra> = {}): Obra {
  return {
    tmdbId,
    tipo: "pelicula",
    titulo: `Obra ${tmdbId}`,
    fechaEstreno: "2010-07-15",
    poster: `https://image.tmdb.org/t/p/w500/${tmdbId}.jpg`,
    posterGradient: "from-sky-500/35 via-night-800 to-night-950",
    ...cambios,
  };
}

function pagina(obras: Obra[]) {
  return { obras, pagina: 1, totalPaginas: 500 };
}

const VEINTE = Array.from({ length: 20 }, (_, indice) => obra(indice + 1));

describe("portada", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(obrasDestacadas).mockReset();
    vi.mocked(obrasEnTendencia).mockReset();
  });

  it("el carrusel muestra las joyas con póster, cada una llevando a su ficha", async () => {
    vi.mocked(obrasDestacadas).mockResolvedValue(
      pagina([obra(1, { poster: undefined }), ...VEINTE.slice(1)])
    );

    render(await CarruselJoyas());

    const fichas = screen.getAllByRole("link");
    expect(fichas).toHaveLength(JOYAS_EN_PORTADA);
    expect(fichas[0].getAttribute("href")).toBe("/content/pelicula/2");
    expect(screen.queryByText("Obra 1")).toBeNull();
  });

  it("las tendencias llenan la grilla mezclando películas y series", async () => {
    vi.mocked(obrasEnTendencia).mockResolvedValue(
      pagina([obra(1399, { tipo: "serie", titulo: "Juego de tronos" }), ...VEINTE])
    );

    render(await GrillaTendencias());

    const fichas = screen.getAllByRole("link");
    expect(fichas).toHaveLength(TENDENCIAS_EN_PORTADA);
    expect(fichas[0].getAttribute("href")).toBe("/content/serie/1399");
    expect(screen.getByText("Juego de tronos")).toBeTruthy();
  });

  it("si TMDB no responde, cada sección lo explica sin romper la portada", async () => {
    vi.mocked(obrasDestacadas).mockRejectedValue(new Error("Error 503"));
    vi.mocked(obrasEnTendencia).mockRejectedValue(new Error("Error 503"));

    render(
      <>
        {await CarruselJoyas()}
        {await GrillaTendencias()}
      </>
    );

    expect(screen.getAllByText(/No pudimos cargar esta lista/)).toHaveLength(2);
  });

  it("mientras cargan, cada sección muestra su esqueleto", () => {
    render(
      <>
        <CarruselEsqueleto />
        <GrillaEsqueleto />
      </>
    );

    expect(screen.getByLabelText("Cargando joyas de la cartelera").getAttribute("aria-busy")).toBe("true");
    const grilla = screen.getByLabelText("Cargando tendencias");
    expect(grilla.querySelectorAll("li")).toHaveLength(TENDENCIAS_EN_PORTADA);
  });

  it("cada sección enlaza a su página completa y arranca mostrando el esqueleto", () => {
    vi.mocked(obrasDestacadas).mockReturnValue(new Promise(() => {}));
    vi.mocked(obrasEnTendencia).mockReturnValue(new Promise(() => {}));

    render(
      <>
        <FeaturedSection />
        <TrendingSection />
      </>
    );

    expect(screen.getByRole("link", { name: /Ver todas las joyas/ }).getAttribute("href")).toBe("/joyas");
    expect(screen.getByRole("link", { name: /Ver todas las tendencias/ }).getAttribute("href")).toBe("/tendencias");
    expect(screen.getByLabelText("Cargando joyas de la cartelera")).toBeTruthy();
    expect(screen.getByLabelText("Cargando tendencias")).toBeTruthy();
  });
});
