
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { CreateContentReview } from "./create-content-review";
import { ApiError, apiFetch } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));

const PROPS = {
  tipo: "pelicula" as const,
  tmdbId: 550,
  usuarioId: "usuario-1",
};

function dialogo() {
  return screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
}

describe("CreateContentReview", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };

    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
  });

  afterEach(() => {
    cleanup();
    vi.mocked(apiFetch).mockReset();
  });

  it("abre el formulario para escribir una reseña", async () => {
    render(<CreateContentReview {...PROPS} onPublicada={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );

    expect(dialogo().open).toBe(true);
    expect(screen.getByRole("group", { name: "Calificación" })).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    expect(screen.getByLabelText("Tu reseña")).toBeTruthy();
  });

  it("publica una reseña con CSRF y actualiza el listado", async () => {
    const onPublicada = vi.fn();

    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ mensaje: "Reseña publicada correctamente" });

    render(<CreateContentReview {...PROPS} onPublicada={onPublicada} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );

    await userEvent.click(screen.getByRole("radio", { name: "4.5 estrellas" }));

    await userEvent.type(
      screen.getByLabelText("Tu reseña"),
      "Excelente película"
    );

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(onPublicada).toHaveBeenCalledOnce();
    });

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/auth/csrf", {
      cache: "no-store",
    });

    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/contenidos/pelicula/550/resenas",
      {
        method: "POST",
        headers: { "X-CSRF-Token": "csrf-prueba" },
        body: JSON.stringify({
          usuario_id: "usuario-1",
          texto: "Excelente película",
          calificacion: 4.5,
          plataforma_id: null,
          resena_padre_id: null,
        }),
      }
    );

    expect(dialogo().open).toBe(false);
  });

  it("publica una respuesta asociada a su reseña padre", async () => {
    const onPublicada = vi.fn();

    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ mensaje: "Reseña publicada correctamente" });

    render(
      <CreateContentReview
        {...PROPS}
        resenaPadreId="resena-original"
        subtitulo="Respondiendo a Ana Pérez"
        onPublicada={onPublicada}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Responder" })
    );

    expect(screen.getByLabelText("Tu respuesta")).toBeTruthy();
    expect(screen.getByText("Respondiendo a Ana Pérez")).toBeTruthy();

    await userEvent.click(screen.getByRole("checkbox", { name: "Incluir valoración" }));
    await userEvent.click(screen.getByRole("radio", { name: "4 estrellas" }));

    await userEvent.type(
      screen.getByLabelText("Tu respuesta"),
      "Estoy de acuerdo con vos"
    );

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    await waitFor(() => {
      expect(onPublicada).toHaveBeenCalledOnce();
    });

    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/contenidos/pelicula/550/resenas",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          usuario_id: "usuario-1",
          texto: "Estoy de acuerdo con vos",
          calificacion: 4,
          plataforma_id: null,
          resena_padre_id: "resena-original",
        }),
      })
    );
  });

  it("muestra el error del backend y mantiene abierto el formulario", async () => {
    const onPublicada = vi.fn();

    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockRejectedValueOnce(
        new ApiError(502, "No fue posible consultar el catálogo")
      );

    render(<CreateContentReview {...PROPS} onPublicada={onPublicada} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );

    await userEvent.click(screen.getByRole("radio", { name: "3 estrellas" }));
    await userEvent.type(
      screen.getByLabelText("Tu reseña"),
      "Una película interesante"
    );

    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "No fue posible consultar el catálogo"
    );

    expect(dialogo().open).toBe(true);
    expect(onPublicada).not.toHaveBeenCalled();
  });

  it("pide una calificación antes de publicar", async () => {
    render(<CreateContentReview {...PROPS} onPublicada={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );
    await userEvent.type(screen.getByLabelText("Tu reseña"), "Sin estrellas");
    await userEvent.click(screen.getByRole("button", { name: "Publicar" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Elegí una calificación"
    );
    expect(apiFetch).not.toHaveBeenCalled();
    expect(dialogo().open).toBe(true);
  });

  it("cuenta los caracteres de la reseña", async () => {
    render(<CreateContentReview {...PROPS} onPublicada={vi.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );
    await userEvent.type(screen.getByLabelText("Tu reseña"), "Genial");

    expect(screen.getByText("6 / 5000")).toBeTruthy();
  });

  it("permite cancelar sin publicar", async () => {
    const onPublicada = vi.fn();

    render(<CreateContentReview {...PROPS} onPublicada={onPublicada} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Cancelar" })
    );

    expect(dialogo().open).toBe(false);
    expect(apiFetch).not.toHaveBeenCalled();
    expect(onPublicada).not.toHaveBeenCalled();
  });
});
