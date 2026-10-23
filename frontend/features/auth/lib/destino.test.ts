import { describe, expect, it } from "vitest";

import { destinoTrasAcceder, hrefAcceso } from "./destino";

describe("destinoTrasAcceder", () => {
  it("sin destino va al catálogo", () => {
    expect(destinoTrasAcceder(undefined)).toBe("/catalogo");
    expect(destinoTrasAcceder("")).toBe("/catalogo");
  });

  it("vuelve a la ruta interna con su búsqueda", () => {
    expect(destinoTrasAcceder("/content/pelicula/603")).toBe("/content/pelicula/603");
    expect(destinoTrasAcceder("/catalogo?q=matrix&pagina=2")).toBe("/catalogo?q=matrix&pagina=2");
    expect(destinoTrasAcceder(["/profile/anatorres", "/otra"])).toBe("/profile/anatorres");
  });

  it("no deja salir del sitio", () => {
    for (const externo of [
      "https://otro-sitio.com",
      "//otro-sitio.com",
      "/\\otro-sitio.com",
      "/\t/otro-sitio.com",
      "javascript:alert(1)",
    ]) {
      expect(destinoTrasAcceder(externo)).toBe("/catalogo");
    }
  });

  it("no vuelve al propio login ni al registro", () => {
    expect(destinoTrasAcceder("/login")).toBe("/catalogo");
    expect(destinoTrasAcceder("/register?volver=/perfil")).toBe("/catalogo");
  });
});

describe("hrefAcceso", () => {
  it("guarda la página actual para volver", () => {
    expect(hrefAcceso("/login", "/content/serie/1399")).toBe(
      "/login?volver=%2Fcontent%2Fserie%2F1399"
    );
    expect(hrefAcceso("/register", "/catalogo?q=matrix")).toBe(
      "/register?volver=%2Fcatalogo%3Fq%3Dmatrix"
    );
  });

  it("desde la portada o sin página no agrega nada", () => {
    expect(hrefAcceso("/login", "/")).toBe("/login");
    expect(hrefAcceso("/login", "/catalogo")).toBe("/login");
    expect(hrefAcceso("/login")).toBe("/login");
  });
});
