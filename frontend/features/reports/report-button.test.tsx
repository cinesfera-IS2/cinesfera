import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "@/lib/api";
import { ReportButton } from "./report-button";

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, apiFetch: vi.fn() };
});

const apiFetchMock = vi.mocked(apiFetch);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReportButton", () => {
  it("envía el reporte normalizado y muestra la confirmación", async () => {
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      return { id: "reporte-1", estado: "pendiente" };
    });
    const usuario = userEvent.setup();
    render(<ReportButton tipo="comentario" objetivoId="comentario-1" />);

    await usuario.click(screen.getByRole("button", { name: "Reportar" }));
    expect(screen.getByRole("heading", { name: "Reportar comentario" })).toBeTruthy();
    await usuario.selectOptions(screen.getByLabelText("Motivo"), "acoso");
    await usuario.type(screen.getByLabelText("Detalles opcionales"), "  Insultos reiterados  ");
    await usuario.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(await screen.findByText("Reporte recibido")).toBeTruthy();
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/reportes",
      expect.objectContaining({
        method: "POST",
        headers: { "X-CSRF-Token": "csrf" },
        body: JSON.stringify({
          tipo: "comentario",
          objetivo_id: "comentario-1",
          motivo: "acoso",
          descripcion: "Insultos reiterados",
        }),
      })
    );

    await usuario.click(screen.getByRole("button", { name: "Entendido" }));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it("muestra el error del backend y permite cancelar", async () => {
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      throw new ApiError(409, "Ya reportaste este elemento");
    });
    const usuario = userEvent.setup();
    render(<ReportButton tipo="usuario" objetivoId="usuario-1" etiqueta="Denunciar perfil" />);

    await usuario.click(screen.getByRole("button", { name: "Denunciar perfil" }));
    expect(screen.getByRole("heading", { name: "Reportar perfil" })).toBeTruthy();
    await usuario.selectOptions(screen.getByLabelText("Motivo"), "spam");
    await usuario.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Ya reportaste este elemento");
    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(HTMLDialogElement.prototype.close).toHaveBeenCalled());
  });
});
