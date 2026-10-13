import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FiltroSelect } from "./filtro-select";

const OPCIONES = [
  { valor: "", etiqueta: "Todos" },
  { valor: "pelicula", etiqueta: "Películas" },
  { valor: "serie", etiqueta: "Series" },
];

describe("FiltroSelect", () => {
  afterEach(cleanup);

  it("muestra las opciones con el valor actual elegido", () => {
    render(
      <FiltroSelect nombre="tipo" etiqueta="Tipo" valor="serie" opciones={OPCIONES} />
    );

    const select = screen.getByLabelText("Tipo") as HTMLSelectElement;
    expect(select.name).toBe("tipo");
    expect(select.value).toBe("serie");
    expect(screen.getAllByRole("option").map((opcion) => opcion.textContent)).toEqual([
      "Todos",
      "Películas",
      "Series",
    ]);
  });

  it("envía el formulario apenas cambia la opción", async () => {
    const enviar = vi.fn((evento: React.FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      return new FormData(evento.currentTarget).get("tipo");
    });
    render(
      <form onSubmit={enviar}>
        <FiltroSelect nombre="tipo" etiqueta="Tipo" valor="" opciones={OPCIONES} />
      </form>
    );

    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "pelicula");

    expect(enviar).toHaveBeenCalledOnce();
    expect(enviar.mock.results[0].value).toBe("pelicula");
  });
});
