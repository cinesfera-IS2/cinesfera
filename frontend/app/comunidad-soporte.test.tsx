import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ComunidadLayout from "./comunidad/layout";
import CargandoComunidad from "./comunidad/loading";
import ComunidadPage from "./comunidad/page";
import SoportePage from "./soporte/page";

vi.mock("@/features/landing/components/landing-header", () => ({
  LandingHeader: () => <header>Cabecera</header>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/form", () => ({
  default: ({ role, children }: React.ComponentProps<"form">) => <form role={role}>{children}</form>,
}));

describe("ruta /comunidad", () => {
  afterEach(cleanup);

  it("el marco tiene título y buscador de perfiles", () => {
    render(<ComunidadLayout params={Promise.resolve({})}>contenido</ComunidadLayout>);

    expect(screen.getByRole("heading", { level: 1, name: "Comunidad" })).toBeTruthy();
    expect(screen.getByRole("search")).toBeTruthy();
    expect(screen.getByText("contenido")).toBeTruthy();
  });

  it("busca el nombre de usuario de la URL, normalizado", async () => {
    const pagina = await ComunidadPage({ searchParams: Promise.resolve({ q: "@Ana" }) } as never);

    expect(pagina.props).toEqual({ consulta: "ana" });
  });

  it("mientras carga muestra el esqueleto", () => {
    render(<CargandoComunidad />);

    expect(screen.getByLabelText("Buscando perfil").getAttribute("aria-busy")).toBe("true");
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
