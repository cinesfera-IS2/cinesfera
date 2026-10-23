import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnlaceAcceder } from "./enlace-acceder";

let pathname = "/";
let busqueda = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => busqueda,
}));

describe("EnlaceAcceder", () => {
  afterEach(() => {
    cleanup();
    pathname = "/";
    busqueda = new URLSearchParams();
  });

  it("recuerda la página actual con su búsqueda", () => {
    pathname = "/catalogo";
    busqueda = new URLSearchParams("q=matrix");

    render(<EnlaceAcceder>Acceder</EnlaceAcceder>);

    expect(screen.getByRole("link", { name: "Acceder" }).getAttribute("href")).toBe(
      "/login?volver=%2Fcatalogo%3Fq%3Dmatrix"
    );
  });

  it("puede llevar al registro", () => {
    pathname = "/content/serie/1399";

    render(<EnlaceAcceder ruta="/register">Crear cuenta</EnlaceAcceder>);

    expect(screen.getByRole("link", { name: "Crear cuenta" }).getAttribute("href")).toBe(
      "/register?volver=%2Fcontent%2Fserie%2F1399"
    );
  });

  it("desde la portada no agrega nada", () => {
    render(<EnlaceAcceder>Acceder</EnlaceAcceder>);

    expect(screen.getByRole("link", { name: "Acceder" }).getAttribute("href")).toBe("/login");
  });
});
