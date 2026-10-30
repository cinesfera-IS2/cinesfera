import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "@/lib/api";
import { ContentReviews } from "./content-reviews";
import { ResenasProvider } from "./resenas-provider";
import type { ResenaContenido } from "../types";


vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {
    constructor(_status: number, message: string) {
      super(message);
    }
  },
  apiFetch: vi.fn(),
}));


const apiFetchMock = vi.mocked(apiFetch);

const BASE: Omit<ResenaContenido, "id" | "fecha" | "texto"> = {
  contenido_tmdb_id: 550,
  resena_padre_id: null,
  plataforma_id: null,
  calificacion: 4.5,
  valoracion: 2,
  promedio_comunitario: null,
  cantidad_valoraciones: 0,
  autor: {
    id: "usuario-1",
    nombre: "Ana",
    apellido: "Pérez",
    nombre_usuario: "ana",
    foto_url: null,
  },
};

const USUARIO = {
  id: "usuario-1",
  nombre: "Ana",
  apellido: "Pérez",
  nombre_usuario: "ana",
  email: "ana@example.com",
  foto_url: null,
  rol: "usuario" as const,
};

const ADMIN = {
  ...USUARIO,
  id: "admin-1",
  nombre_usuario: "admin",
  email: "admin@example.com",
  rol: "admin" as const,
};


function renderizar(
  usuario: typeof USUARIO | typeof ADMIN | null,
  tipo: "pelicula" | "serie" = "pelicula",
  tmdbId = 550
) {
  return render(
    <ResenasProvider
      tipo={tipo}
      tmdbId={tmdbId}
      usuarioId={usuario?.rol === "admin" ? undefined : usuario?.id}
    >
      <ContentReviews usuario={usuario} />
    </ResenasProvider>
  );
}


afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  window.history.replaceState(null, "", window.location.pathname);
});


describe("ContentReviews", () => {
  it("muestra las reseñas en orden cronológico descendente", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "antigua",
        fecha: "2026-08-01T12:00:00Z",
        texto: "Reseña antigua",
      },
      {
        ...BASE,
        id: "reciente",
        fecha: "2026-09-01T12:00:00Z",
        texto: "Reseña reciente",
      },
    ]);

    renderizar(null);

    const articulos = await screen.findAllByRole("article");
    expect(articulos).toHaveLength(2);
    expect(articulos[0].textContent).toContain("Reseña reciente");
    expect(articulos[1].textContent).toContain("Reseña antigua");
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/contenidos/pelicula/550/resenas",
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("informa cuando todavía no existen reseñas", async () => {
    apiFetchMock.mockResolvedValue([]);

    renderizar(null, "serie", 1399);

    expect(
      await screen.findByText("Todavía no existen reseñas")
    ).toBeTruthy();
  });

  it("muestra el error y permite volver a intentar", async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error("Backend no disponible"))
      .mockResolvedValueOnce([]);
    const user = userEvent.setup();

    renderizar(null);

    expect(
      await screen.findByText("No pudimos cargar las reseñas")
    ).toBeTruthy();
    expect(screen.getByText("Backend no disponible")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Volver a intentar" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText("Todavía no existen reseñas")
    ).toBeTruthy();
  });


  it("permite leer reseñas sin iniciar sesión, pero no responder", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    renderizar(null);

    expect(await screen.findByText("Una película excelente")).toBeTruthy();

    expect(
      screen.queryByRole("button", { name: "Responder" })
    ).toBeNull();
    expect(screen.getByRole("article").id).toBe("resena-resena-1");
  });

  it("desplaza hasta la reseña indicada en el fragmento de la URL", async () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    window.history.replaceState(null, "", "#resena-resena-1");
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Reseña enlazada",
      },
    ]);

    renderizar(null);

    await screen.findByText("Reseña enlazada");
    await waitFor(() => expect(desplazar).toHaveBeenCalledWith({ block: "center" }));
  });

  it("permite responder al usuario autenticado", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    renderizar(USUARIO);

    expect(await screen.findByText("Una película excelente")).toBeTruthy();

    expect(
      screen.getByRole("button", { name: "Responder" })
    ).toBeTruthy();
  });

  it("permite al administrador leer y eliminar cualquier reseña sin pedir valoraciones propias", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    apiFetchMock.mockImplementation(async (ruta, opciones) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf-prueba" };
      if (opciones?.method === "DELETE") return undefined;
      return [{
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Reseña moderable",
      }];
    });

    renderizar(ADMIN);

    expect(await screen.findByText("Reseña moderable")).toBeTruthy();
    expect(apiFetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/valoraciones/mias"),
      expect.anything()
    );
    expect(screen.queryByRole("button", { name: "Responder" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Eliminar reseña" }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith(
      "/contenidos/pelicula/550/resenas/resena-1",
      expect.objectContaining({
        method: "DELETE",
        headers: { "X-CSRF-Token": "csrf-prueba" },
      })
    ));
  });

  it("solo ofrece eliminar al usuario cuando la reseña es propia", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "propia",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Reseña propia",
      },
      {
        ...BASE,
        id: "ajena",
        fecha: "2026-10-17T12:00:00Z",
        texto: "Reseña ajena",
        autor: { ...BASE.autor, id: "usuario-2", nombre_usuario: "otra" },
      },
    ]);

    renderizar(USUARIO);

    const propia = (await screen.findByText("Reseña propia")).closest("article")!;
    const ajena = screen.getByText("Reseña ajena").closest("article")!;
    expect(within(propia).getByRole("button", { name: "Eliminar reseña" })).toBeTruthy();
    expect(within(ajena).queryByRole("button", { name: "Eliminar reseña" })).toBeNull();
  });

  it("no elimina la reseña si se cancela la confirmación", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    apiFetchMock.mockResolvedValue([{
      ...BASE,
      id: "resena-1",
      fecha: "2026-10-16T12:00:00Z",
      texto: "Reseña moderable",
    }]);

    renderizar(ADMIN);
    await user.click(await screen.findByRole("button", { name: "Eliminar reseña" }));

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).not.toHaveBeenCalledWith("/auth/csrf", expect.anything());
  });

  it("informa el error si el servidor rechaza el borrado", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") throw new ApiError(403, "No autorizado");
      return [{
        ...BASE,
        id: "resena-1",
        fecha: "2026-10-16T12:00:00Z",
        texto: "Reseña moderable",
      }];
    });

    renderizar(ADMIN);
    await user.click(await screen.findByRole("button", { name: "Eliminar reseña" }));

    expect((await screen.findByRole("alert")).textContent).toContain("No autorizado");
    expect(
      screen.getByRole("button", { name: "Eliminar reseña" }).hasAttribute("disabled")
    ).toBe(false);
  });

  it("muestra sin estrellas una reseña guardada sin calificación", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "sin-nota",
        calificacion: null,
        fecha: "2026-10-16T12:00:00Z",
        texto: "Respuesta sin nota",
      },
    ]);

    renderizar(null);

    expect(await screen.findByText("Respuesta sin nota")).toBeTruthy();
    expect(screen.queryByRole("img", { name: /estrellas/ })).toBeNull();
  });

  it("muestra las respuestas anidadas dentro del hilo correspondiente", async () => {
    apiFetchMock.mockResolvedValue([
      {
        ...BASE,
        id: "respuesta-1",
        resena_padre_id: "resena-1",
        fecha: "2026-10-16T13:00:00Z",
        texto: "Estoy de acuerdo",
      },
      {
        ...BASE,
        id: "resena-1",
        resena_padre_id: null,
        fecha: "2026-10-16T12:00:00Z",
        texto: "Una película excelente",
      },
    ]);

    const { container } = renderizar(null);

    expect(await screen.findByText("Estoy de acuerdo")).toBeTruthy();

    const articulos = screen.getAllByRole("article");
    expect(articulos).toHaveLength(2);

    expect(articulos[0].textContent).toContain("Una película excelente");
    expect(articulos[1].textContent).toContain("Estoy de acuerdo");
    expect(within(articulos[1]).queryByRole("img", { name: /estrellas/ })).toBeNull();

    const hilo = articulos[1].parentElement;

    expect(hilo).not.toBeNull();
    expect(hilo?.parentElement?.className).toContain("border-l");

    expect(container.querySelectorAll("article")).toHaveLength(2);
  });
});
