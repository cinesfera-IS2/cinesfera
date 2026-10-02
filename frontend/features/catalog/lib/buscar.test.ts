import { describe, expect, it } from "vitest";

import { filtrarObras } from "./buscar";
import { leerFiltros } from "./filtros";
import type { Obra } from "@/features/catalog/types";

function obra(datos: Partial<Obra> & Pick<Obra, "id">): Obra {
  return {
    tipo: "pelicula",
    titulo: datos.id,
    fechaEstreno: "2000-01-01",
    generos: ["drama"],
    calificacion: 4,
    popularidad: 50,
    posterGradient: "",
    ...datos,
  };
}

const OBRAS = [
  obra({ id: "a", titulo: "Acción total", generos: ["accion"], fechaEstreno: "1994-06-10", popularidad: 10, calificacion: 3 }),
  obra({ id: "b", tipo: "serie", titulo: "Beta", generos: ["drama"], fechaEstreno: "2019-03-01", popularidad: 30, calificacion: 5 }),
  obra({ id: "c", titulo: "Ciudad", generos: ["drama", "accion"], fechaEstreno: "2008-11-20", popularidad: 20, calificacion: 4 }),
];

function ids(resultado: { obras: Obra[] }) {
  return resultado.obras.map((o) => o.id);
}

describe("filtrarObras", () => {
  it("por defecto ordena por popularidad", () => {
    expect(ids(filtrarObras(OBRAS, leerFiltros({}), 10))).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("busca por título sin importar tildes ni mayúsculas", () => {
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ q: "ACCION" }), 10))
    ).toEqual(["a"]);
  });

  it("filtra por cualquiera de los géneros de la obra", () => {
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ genero: "accion" }), 10))
    ).toEqual(["c", "a"]);
  });

  it("filtra por tipo", () => {
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ tipo: "serie" }), 10))
    ).toEqual(["b"]);
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ tipo: "pelicula" }), 10))
    ).toEqual(["c", "a"]);
  });

  it("filtra por año de estreno", () => {
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ anio: "2008" }), 10))
    ).toEqual(["c"]);
  });

  it("ordena por fecha de estreno de la más reciente a la más vieja", () => {
    expect(
      ids(filtrarObras(OBRAS, leerFiltros({ orden: "recientes" }), 10))
    ).toEqual(["b", "c", "a"]);
  });

  it("pagina los resultados", () => {
    const resultado = filtrarObras(
      OBRAS,
      leerFiltros({ orden: "titulo", pagina: "2" }),
      2
    );

    expect(ids(resultado)).toEqual(["c"]);
    expect(resultado).toMatchObject({ total: 3, pagina: 2, totalPaginas: 2 });
  });

  it("si la página pedida no existe devuelve la última", () => {
    const resultado = filtrarObras(
      OBRAS,
      leerFiltros({ pagina: "9" }),
      2
    );

    expect(resultado.pagina).toBe(2);
    expect(ids(resultado)).toEqual(["a"]);
  });

  it("sin coincidencias devuelve una sola página vacía", () => {
    expect(
      filtrarObras(OBRAS, leerFiltros({ q: "zzz" }), 10)
    ).toMatchObject({ obras: [], total: 0, pagina: 1, totalPaginas: 1 });
  });
});
