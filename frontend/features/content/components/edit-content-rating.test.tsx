import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { EditContentRating } from "./edit-content-rating";
import { ContentReviews } from "./content-reviews";
import { ResenasProvider } from "./resenas-provider";
import type { ResenaContenido } from "../types";

vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));
const api = vi.mocked(apiFetch);
const actualizada = { resena_id: "padre", calificacion: 4.5, promedio_comunitario: 3.75, cantidad_valoraciones: 2 };
const props = { tipo: "pelicula" as const, tmdbId: 550, resenaId: "padre", calificacion: 2 };
const usuario = { id: "yo", nombre: "Ana", apellido: "Pérez", nombre_usuario: "ana", email: "ana@example.com", foto_url: null };
const padre: ResenaContenido = {
  id: "padre", contenido_tmdb_id: 550, resena_padre_id: null, plataforma_id: null,
  calificacion: 4.5, texto: "Reseña original", fecha: "2026-10-16T12:00:00Z",
  valoracion: 0, promedio_comunitario: 4, cantidad_valoraciones: 2,
  autor: { ...usuario, id: "autor" },
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(() => { cleanup(); api.mockReset(); });

describe("Editar valoración", () => {
  it("abre con la puntuación actual y permite cancelar sin solicitudes", async () => {
    const onActualizada = vi.fn();
    render(<EditContentRating {...props} onActualizada={onActualizada} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    expect((screen.getByRole("radio", { name: "2 estrellas" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByRole("radio")).toHaveLength(10);
    await userEvent.click(screen.getByRole("radio", { name: "4.5 estrellas" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(api).not.toHaveBeenCalled();
    expect(onActualizada).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    expect((screen.getByRole("radio", { name: "2 estrellas" }) as HTMLInputElement).checked).toBe(true);
  });

  it("guarda solo la puntuación por PATCH con CSRF", async () => {
    const onActualizada = vi.fn();
    api.mockResolvedValueOnce({ csrf_token: "csrf" }).mockResolvedValueOnce(actualizada);
    const { rerender } = render(<EditContentRating {...props} onActualizada={onActualizada} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    await userEvent.click(screen.getByRole("radio", { name: "4.5 estrellas" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onActualizada).toHaveBeenCalledWith(actualizada));
    expect(api).toHaveBeenNthCalledWith(1, "/auth/csrf", { cache: "no-store" });
    expect(api).toHaveBeenNthCalledWith(2, "/contenidos/pelicula/550/resenas/padre/valoracion", {
      method: "PATCH", headers: { "X-CSRF-Token": "csrf" }, body: JSON.stringify({ calificacion: 4.5 }),
    });
    expect((screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement).open).toBe(false);
    rerender(<EditContentRating {...props} calificacion={4.5} onActualizada={onActualizada} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    expect((screen.getByRole("radio", { name: "4.5 estrellas" }) as HTMLInputElement).checked).toBe(true);
  });

  it("mantiene el valor guardado ante un error y permite reintentar", async () => {
    const onActualizada = vi.fn();
    api.mockResolvedValueOnce({ csrf_token: "csrf" }).mockRejectedValueOnce(new Error("Error de red"));
    render(<EditContentRating {...props} onActualizada={onActualizada} />);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    await userEvent.click(screen.getByRole("radio", { name: "4.5 estrellas" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect((await screen.findByRole("alert")).textContent).toContain("No pudimos actualizar");
    expect(onActualizada).not.toHaveBeenCalled();
    expect((screen.getByRole("dialog") as HTMLDialogElement).open).toBe(true);
    api.mockResolvedValueOnce({ csrf_token: "csrf" }).mockResolvedValueOnce(actualizada);
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(onActualizada).toHaveBeenCalledOnce());
  });

  it("actualiza el promedio en pantalla y conserva el comentario y el contador", async () => {
    const comentario: ResenaContenido = { ...padre, id: "comentario", autor: usuario, resena_padre_id: "padre", calificacion: 5, texto: "Mi comentario original" };
    api.mockImplementation(async (ruta, opciones) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      if (opciones?.method === "PATCH") return { ...actualizada, calificacion: 1, promedio_comunitario: 2 };
      if (ruta.endsWith("/valoraciones/mias")) return [{ resena_id: "padre", calificacion: 5 }];
      return [padre, comentario];
    });
    render(<ResenasProvider tipo="pelicula" tmdbId={550} usuarioId={usuario.id}><ContentReviews usuario={usuario} /></ResenasProvider>);
    await screen.findByText("Promedio de la comunidad: 4 / 5 · 2 valoraciones");
    expect(screen.getAllByRole("button", { name: "Editar valoración" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    expect((within(screen.getByRole("dialog")).getByRole("radio", { name: "5 estrellas" }) as HTMLInputElement).checked).toBe(true);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("radio", { name: "1 estrella" }));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Promedio de la comunidad: 2 / 5 · 2 valoraciones")).toBeTruthy();
    expect(screen.getByText("Mi comentario original")).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Editar valoración" }));
    expect((within(screen.getByRole("dialog")).getByRole("radio", { name: "1 estrella" }) as HTMLInputElement).checked).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Responder" })[0]);
    expect(within(screen.getByRole("dialog")).queryByRole("group", { name: "Calificación" })).toBeNull();
  });

  it.each([null, usuario])("no ofrece editar si no hay valoración propia (sesión: %s)", async (sesion) => {
    api.mockImplementation(async (ruta) => ruta.endsWith("/valoraciones/mias") ? [] : [padre]);
    render(<ResenasProvider tipo="pelicula" tmdbId={550} usuarioId={sesion?.id}><ContentReviews usuario={sesion} /></ResenasProvider>);
    await screen.findByText("Reseña original");
    expect(screen.queryByRole("button", { name: "Editar valoración" })).toBeNull();
    if (!sesion) expect(api).toHaveBeenCalledTimes(1);
  });
});
