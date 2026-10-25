import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnlaceExplorar } from "./enlace-explorar";

let pathname: string | null = "/";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("EnlaceExplorar", () => {
  afterEach(() => {
    cleanup();
    pathname = "/";
  });

  it("lleva al catálogo", () => {
    render(<EnlaceExplorar />);

    const enlace = screen.getByRole("link", { name: "Explorar" });
    expect(enlace.getAttribute("href")).toBe("/catalogo");
    expect(enlace.getAttribute("aria-current")).toBeNull();
  });

  it("dentro del catálogo queda marcado como la página actual", () => {
    pathname = "/catalogo";

    render(<EnlaceExplorar />);

    expect(screen.getByRole("link", { name: "Explorar" }).getAttribute("aria-current")).toBe("page");
  });

  it("sin ruta conocida no marca nada", () => {
    pathname = null;

    render(<EnlaceExplorar />);

    expect(screen.getByRole("link", { name: "Explorar" }).getAttribute("aria-current")).toBeNull();
  });
});
