import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { CreateReviewDialog } from "./create-review-dialog";
import { ApiError, apiFetch } from "@/lib/api";

const refrescar = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refrescar }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  apiFetch: vi.fn(),
}));

function dialogo() {
  return screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement;
}

describe("CreateReviewDialog", () => {
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
    refrescar.mockReset();
  });

  it("abre el formulario desde el botón del perfil", async () => {
    render(<CreateReviewDialog usuarioId="u1" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );

    expect(dialogo().open).toBe(true);
    expect(screen.getByLabelText("ID de TMDB")).toBeTruthy();
    expect(screen.getByLabelText("Reseña")).toBeTruthy();
  });

  it("publica con CSRF, cierra y refresca el perfil", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ mensaje: "Reseña publicada correctamente" });
    render(<CreateReviewDialog usuarioId="u1" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );
    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "serie");
    await userEvent.type(screen.getByLabelText("ID de TMDB"), "1399");
    await userEvent.selectOptions(
      screen.getByLabelText("Calificación"),
      "5"
    );
    await userEvent.type(screen.getByLabelText("Reseña"), "Excelente serie");
    await userEvent.click(
      screen.getByRole("button", { name: "Publicar reseña" })
    );

    expect(apiFetch).toHaveBeenNthCalledWith(1, "/auth/csrf", {
      cache: "no-store",
    });
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/contenidos/serie/1399/resenas",
      {
        method: "POST",
        headers: { "X-CSRF-Token": "csrf-prueba" },
        body: JSON.stringify({
          usuario_id: "u1",
          texto: "Excelente serie",
          calificacion: 5,
          plataforma_id: null,
          resena_padre_id: null,
        }),
      }
    );
    expect(dialogo().open).toBe(false);
    expect(refrescar).toHaveBeenCalledOnce();
  });

  it("muestra el error del backend y conserva el diálogo abierto", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockRejectedValueOnce(new ApiError(404, "Contenido no encontrado"));
    render(<CreateReviewDialog usuarioId="u1" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Escribir una reseña" })
    );
    await userEvent.type(screen.getByLabelText("ID de TMDB"), "999999");
    await userEvent.type(screen.getByLabelText("Reseña"), "No existe");
    await userEvent.click(
      screen.getByRole("button", { name: "Publicar reseña" })
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Contenido no encontrado"
    );
    expect(dialogo().open).toBe(true);
    expect(refrescar).not.toHaveBeenCalled();
  });
});
