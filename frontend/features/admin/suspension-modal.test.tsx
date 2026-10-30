import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SuspensionModal } from "./suspension-modal";

afterEach(cleanup);

describe("SuspensionModal", () => {
  it("envía una suspensión temporal por horas con el motivo normalizado", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.fn().mockResolvedValue(undefined);
    render(<SuspensionModal cuenta={{ nombre: "Ana", apellido: "Pérez", nombre_usuario: "ana" }} confirmar={confirmar} cerrar={vi.fn()} />);

    expect(screen.getByText(/Ana Pérez · @ana/)).toBeTruthy();
    await usuario.type(screen.getByLabelText("Motivo"), "  Incumplimiento reiterado  ");
    await usuario.click(screen.getByLabelText("temporal"));
    await usuario.type(screen.getByLabelText("Cantidad"), "6");
    expect(screen.getByText(/hora de Uruguay/)).toBeTruthy();
    await usuario.click(screen.getByRole("button", { name: "Confirmar suspensión" }));

    await waitFor(() => expect(confirmar).toHaveBeenCalledWith({
      motivo: "Incumplimiento reiterado",
      tipo_suspension: "temporal",
      duracion_suspension: 6,
      unidad_suspension: "horas",
      ocultar_contenido: true,
    }));
  });

  it("no preselecciona indefinida y permite cerrar con Escape", async () => {
    const usuario = userEvent.setup();
    const cerrar = vi.fn();
    render(<SuspensionModal cuenta={{ nombre: "Ana", nombre_usuario: "ana" }} confirmar={vi.fn()} cerrar={cerrar} />);

    expect((screen.getByLabelText("indefinida") as HTMLInputElement).checked).toBe(false);
    await usuario.keyboard("{Escape}");
    expect(cerrar).toHaveBeenCalledOnce();
  });

  it("valida motivo, tipo y límites de la duración", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.fn();
    render(<SuspensionModal cuenta={{ nombre: "Ana", nombre_usuario: "ana" }} confirmar={confirmar} cerrar={vi.fn()} />);

    const formulario = screen.getByRole("button", { name: "Confirmar suspensión" }).closest("form");
    expect(formulario).not.toBeNull();
    fireEvent.submit(formulario!);
    expect(screen.getByRole("alert").textContent).toContain("motivo");

    await usuario.type(screen.getByLabelText("Motivo"), "Incumplimiento");
    fireEvent.submit(formulario!);
    expect(screen.getByRole("alert").textContent).toContain("Seleccioná");

    await usuario.click(screen.getByLabelText("temporal"));
    await usuario.type(screen.getByLabelText("Cantidad"), "0");
    fireEvent.submit(formulario!);
    expect(screen.getByRole("alert").textContent).toContain("entero positivo");

    await usuario.clear(screen.getByLabelText("Cantidad"));
    await usuario.type(screen.getByLabelText("Cantidad"), "8761");
    fireEvent.submit(formulario!);
    expect(screen.getByRole("alert").textContent).toContain("8760 horas");
    expect(confirmar).not.toHaveBeenCalled();
  });

  it("envía una suspensión indefinida y presenta errores de confirmación", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.fn().mockRejectedValue(new Error("No se pudo guardar"));
    render(<SuspensionModal cuenta={{ nombre: "Ana", nombre_usuario: "ana" }} confirmar={confirmar} cerrar={vi.fn()} />);

    await usuario.type(screen.getByLabelText("Motivo"), "Incumplimiento");
    await usuario.click(screen.getByLabelText("indefinida"));
    expect(screen.getByText(/hasta que un administrador/)).toBeTruthy();
    await usuario.click(screen.getByRole("button", { name: "Confirmar suspensión" }));

    await waitFor(() => expect(confirmar).toHaveBeenCalledWith({
      motivo: "Incumplimiento",
      tipo_suspension: "indefinida",
      duracion_suspension: null,
      unidad_suspension: null,
      ocultar_contenido: true,
    }));
    expect((await screen.findByRole("alert")).textContent).toContain("No se pudo guardar");
  });
});
