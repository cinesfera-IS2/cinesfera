import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { SelectorCalificacion } from "./selector-calificacion";

function valorDelFormulario(formulario: HTMLFormElement) {
  return new FormData(formulario).get("calificacion");
}

afterEach(cleanup);

describe("SelectorCalificacion", () => {
  it("ofrece de media a cinco estrellas, por mitades", () => {
    render(<SelectorCalificacion name="calificacion" />);

    const opciones = screen.getAllByRole("radio");
    expect(opciones).toHaveLength(10);
    expect(screen.getByRole("radio", { name: "0.5 estrellas" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "1 estrella" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "5 estrellas" })).toBeTruthy();
    expect(screen.getByText("Sin calificar")).toBeTruthy();
  });

  it("marca media estrella y la manda en el formulario", async () => {
    const { container } = render(
      <form>
        <SelectorCalificacion name="calificacion" />
      </form>
    );

    await userEvent.click(screen.getByRole("radio", { name: "3.5 estrellas" }));

    expect(screen.getByText("3.5")).toBeTruthy();
    expect(screen.getByText("Muy buena")).toBeTruthy();
    expect(valorDelFormulario(container.querySelector("form")!)).toBe("3.5");
  });

  it("arranca con la calificación inicial y vuelve a ella al reiniciar el formulario", async () => {
    const { container } = render(
      <form>
        <SelectorCalificacion name="calificacion" valorInicial={4.5} />
      </form>
    );
    const formulario = container.querySelector("form")!;

    expect(valorDelFormulario(formulario)).toBe("4.5");

    await userEvent.click(screen.getByRole("radio", { name: "2 estrellas" }));
    expect(valorDelFormulario(formulario)).toBe("2");

    act(() => formulario.reset());

    expect(valorDelFormulario(formulario)).toBe("4.5");
    expect(await screen.findByText("4.5")).toBeTruthy();
  });

  it("sin calificación inicial no manda nada", () => {
    const { container } = render(
      <form>
        <SelectorCalificacion name="calificacion" />
      </form>
    );

    expect(valorDelFormulario(container.querySelector("form")!)).toBeNull();
  });
});
