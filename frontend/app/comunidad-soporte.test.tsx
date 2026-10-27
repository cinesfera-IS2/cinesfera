import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ComunidadPage from "./comunidad/page";
import SoportePage from "./soporte/page";

vi.mock("@/features/landing/components/landing-header", () => ({
  LandingHeader: () => <header>Cabecera</header>,
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("ruta /comunidad", () => {
  afterEach(cleanup);

  it("presenta la comunidad con el buscador de usuarios", () => {
    render(<ComunidadPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Comunidad" })).toBeTruthy();
    expect(screen.getByRole("search")).toBeTruthy();
  });
});

describe("ruta /soporte", () => {
  afterEach(cleanup);

  it("ofrece escribir al correo de soporte", () => {
    render(<SoportePage />);

    const correo = screen.getByRole("link", { name: "Enviar un correo" });
    expect(correo.getAttribute("href")).toMatch(/^mailto:soporte@cinesfera\.com\?subject=/);
    expect(screen.getByText("soporte@cinesfera.com")).toBeTruthy();
  });
});
