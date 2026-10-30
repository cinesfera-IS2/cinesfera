import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EnlaceDestino } from "./enlace-destino";

let pathname: string | null = "/";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("EnlaceDestino", () => {
  afterEach(() => {
    cleanup();
    pathname = "/";
  });

  it("un destino disponible es un enlace", () => {
    render(<EnlaceDestino link={{ label: "Comunidad", href: "/comunidad" }} className="" pendienteClassName="" />);

    const enlace = screen.getByRole("link", { name: "Comunidad" });
    expect(enlace.getAttribute("href")).toBe("/comunidad");
    expect(enlace.getAttribute("aria-current")).toBeNull();
  });

  it("queda marcado como actual en su ruta y en las que cuelgan de ella", () => {
    pathname = "/tendencias/algo";

    render(<EnlaceDestino link={{ label: "Tendencias", href: "/tendencias" }} className="" pendienteClassName="" />);

    expect(screen.getByRole("link", { name: "Tendencias" }).getAttribute("aria-current")).toBe("page");
  });

  it("un destino sin implementar no es un enlace y avisa que viene después", () => {
    render(<EnlaceDestino link={{ label: "Foros" }} className="" pendienteClassName="" />);

    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Foros").textContent).toBe("Foros (próximamente)");
  });

  it("con un ícono, el nombre queda para lectores de pantalla", () => {
    render(
      <EnlaceDestino link={{ label: "Instagram" }} className="" pendienteClassName="">
        <svg data-testid="icono" />
      </EnlaceDestino>
    );

    expect(screen.getByTestId("icono")).toBeTruthy();
    expect(screen.getByText("Instagram").className).toBe("sr-only");
  });
});
