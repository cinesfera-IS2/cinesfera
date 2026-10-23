import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Desplegable } from "./desplegable";

let pathname = "/catalogo";

vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

function renderizar() {
  return render(
    <>
      <p>Afuera</p>
      <Desplegable
        etiqueta="Menú"
        boton="Abrir"
        botonClassName=""
        panelClassName=""
      >
        <a href="#comunidad">Comunidad</a>
        <span>Texto del panel</span>
      </Desplegable>
    </>
  );
}

const boton = () => screen.getByRole("button", { name: "Menú" });

describe("Desplegable", () => {
  afterEach(() => {
    cleanup();
    pathname = "/catalogo";
  });

  it("abre y cierra el panel con el botón", async () => {
    renderizar();
    const usuario = userEvent.setup();

    expect(boton().getAttribute("aria-expanded")).toBe("false");
    await usuario.click(boton());
    expect(boton().getAttribute("aria-expanded")).toBe("true");

    const panel = document.getElementById(boton().getAttribute("aria-controls")!);
    expect(panel?.dataset.abierto).toBe("true");

    await usuario.click(boton());
    expect(boton().getAttribute("aria-expanded")).toBe("false");
  });

  it("Escape lo cierra y devuelve el foco al botón", async () => {
    renderizar();
    const usuario = userEvent.setup();
    await usuario.click(boton());

    await usuario.keyboard("{Escape}");

    expect(boton().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(boton());
  });

  it("otras teclas no lo cierran", async () => {
    renderizar();
    const usuario = userEvent.setup();
    await usuario.click(boton());

    await usuario.keyboard("a");

    expect(boton().getAttribute("aria-expanded")).toBe("true");
  });

  it("un toque afuera lo cierra, uno adentro no", async () => {
    renderizar();
    await userEvent.setup().click(boton());

    fireEvent.pointerDown(screen.getByText("Texto del panel"));
    expect(boton().getAttribute("aria-expanded")).toBe("true");

    fireEvent.pointerDown(screen.getByText("Afuera"));
    expect(boton().getAttribute("aria-expanded")).toBe("false");
  });

  it("elegir un enlace lo cierra aunque no cambie la página", async () => {
    renderizar();
    const usuario = userEvent.setup();
    await usuario.click(boton());

    await usuario.click(screen.getByText("Texto del panel"));
    expect(boton().getAttribute("aria-expanded")).toBe("true");

    await usuario.click(screen.getByRole("link", { name: "Comunidad" }));
    expect(boton().getAttribute("aria-expanded")).toBe("false");
  });

  it("al cambiar de página se cierra solo", async () => {
    const { rerender } = renderizar();
    await userEvent.setup().click(boton());

    pathname = "/profile/anatorres";
    rerender(
      <Desplegable etiqueta="Menú" boton="Abrir" botonClassName="" panelClassName="">
        <span>Texto del panel</span>
      </Desplegable>
    );

    expect(boton().getAttribute("aria-expanded")).toBe("false");
  });
});
