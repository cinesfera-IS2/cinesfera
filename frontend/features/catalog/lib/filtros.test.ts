import { describe, expect, it } from "vitest";

import {
  filtrosActivos,
  hrefCatalogo,
  leerFiltros,
  paginasVisibles,
  tituloResultados,
} from "./filtros";

describe("leerFiltros", () => {
  it("sin parámetros usa los valores por defecto", () => {
    expect(leerFiltros({})).toEqual({
      texto: undefined,
      genero: undefined,
      tipo: undefined,
      anioEstreno: undefined,
      orden: "populares",
      pagina: 1,
    });
  });

  it("lee los filtros válidos de la URL", () => {
    expect(
      leerFiltros({
        q: "  matrix ",
        genero: "ciencia-ficcion",
        tipo: "pelicula",
        anio: "1999",
        orden: "calificacion",
        pagina: "3",
      })
    ).toEqual({
      texto: "matrix",
      genero: "ciencia-ficcion",
      tipo: "pelicula",
      anioEstreno: 1999,
      orden: "calificacion",
      pagina: 3,
    });
  });

  it("descarta los valores que no reconoce", () => {
    expect(
      leerFiltros({
        q: "   ",
        genero: "western",
        tipo: "documental",
        anio: "1850",
        orden: "azar",
        pagina: "-2",
      })
    ).toEqual({
      texto: undefined,
      genero: undefined,
      tipo: undefined,
      anioEstreno: undefined,
      orden: "populares",
      pagina: 1,
    });
  });

  it("no deja pasar de la última página que permite TMDB", () => {
    expect(leerFiltros({ pagina: "900" }).pagina).toBe(500);
  });

  it("si un parámetro viene repetido se queda con el primero", () => {
    expect(leerFiltros({ genero: ["drama", "terror"] }).genero).toBe("drama");
  });
});

describe("hrefCatalogo", () => {
  const filtros = leerFiltros({ q: "el padrino", genero: "drama" });

  it("omite los valores por defecto", () => {
    expect(hrefCatalogo(leerFiltros({}))).toBe("/catalogo");
  });

  it("mantiene los filtros actuales y aplica los cambios", () => {
    expect(hrefCatalogo(filtros, { pagina: 2 })).toBe(
      "/catalogo?q=el+padrino&genero=drama&pagina=2"
    );
  });

  it("escribe el tipo y el año de estreno", () => {
    expect(
      hrefCatalogo(leerFiltros({}), {
        tipo: "serie",
        anioEstreno: 2015,
      })
    ).toBe("/catalogo?tipo=serie&anio=2015");
  });

  it("puede sacar un filtro", () => {
    expect(hrefCatalogo(filtros, { genero: undefined })).toBe(
      "/catalogo?q=el+padrino"
    );
  });
});

describe("tituloResultados", () => {
  const base = leerFiltros({});

  it("sin filtros nombra lo que devuelve el backend: lo más nuevo", () => {
    expect(tituloResultados(base)).toBe("Últimos estrenos");
  });

  it("combina tipo y año", () => {
    expect(tituloResultados({ ...base, tipo: "serie" })).toBe("Series");
    expect(tituloResultados({ ...base, anioEstreno: 1999 })).toBe("Películas y series de 1999");
    expect(tituloResultados({ ...base, tipo: "pelicula", anioEstreno: 1999 })).toBe(
      "Películas de 1999"
    );
  });

  it("una búsqueda manda sobre el resto", () => {
    expect(tituloResultados({ ...base, texto: "dark", tipo: "serie" })).toBe(
      "Resultados para «dark»"
    );
  });
});

describe("filtrosActivos", () => {
  it("sin filtros no hay nada que quitar", () => {
    expect(filtrosActivos(leerFiltros({}))).toEqual([]);
  });

  it("cada filtro sabe cómo quitarse y vuelve a la primera página", () => {
    const filtros = leerFiltros({ q: "dark", tipo: "serie", anio: "2017", pagina: "3" });

    expect(filtrosActivos(filtros)).toEqual([
      { clave: "texto", etiqueta: "«dark»", hrefSinFiltro: "/catalogo?tipo=serie&anio=2017" },
      { clave: "tipo", etiqueta: "Series", hrefSinFiltro: "/catalogo?q=dark&anio=2017" },
      { clave: "anioEstreno", etiqueta: "2017", hrefSinFiltro: "/catalogo?q=dark&tipo=serie" },
    ]);
  });
});

describe("paginasVisibles", () => {
  it("con pocas páginas las muestra todas", () => {
    expect(paginasVisibles(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it.each([
    [1, [1, 2, 3, 4, 5, "…", 10]],
    [5, [1, "…", 4, 5, 6, "…", 10]],
    [10, [1, "…", 6, 7, 8, 9, 10]],
  ])("en la página %i de 10 muestra %j", (actual, esperado) => {
    expect(paginasVisibles(actual, 10)).toEqual(esperado);
  });
});
