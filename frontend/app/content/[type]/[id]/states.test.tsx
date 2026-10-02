import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ContentError from "./error";
import ContentNotFound from "./not-found";


afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});


describe("estados de la ficha", () => {
  it("muestra el 404", () => {
    render(<ContentNotFound />);

    expect(screen.getByText("Contenido no encontrado")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Volver al inicio" })).toBeTruthy();
  });

  it("registra el error y permite reintentar", async () => {
    const error = new Error("Fallo de catálogo");
    const reset = vi.fn();
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    render(<ContentError error={error} reset={reset} />);

    expect(screen.getByText("No pudimos cargar esta ficha")).toBeTruthy();
    expect(consoleError).toHaveBeenCalledWith(error);
    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
