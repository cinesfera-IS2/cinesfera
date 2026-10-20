import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { PuntajeComunidad } from "./puntaje-comunidad";
import { ResenasProvider } from "./resenas-provider";


vi.mock("@/lib/api", () => ({ apiFetch: vi.fn() }));

const apiFetchMock = vi.mocked(apiFetch);

const AUTOR = {
  id: "u1",
  nombre: "Ana",
  apellido: "Pérez",
  nombre_usuario: "ana",
  foto_url: null,
};

function renderizar() {
  return render(
    <ResenasProvider tipo="pelicula" tmdbId={550}>
      <dl>
        <PuntajeComunidad />
      </dl>
    </ResenasProvider>
  );
}


afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});


describe("PuntajeComunidad", () => {
  it("muestra el promedio y cuántas reseñas lo forman", async () => {
    apiFetchMock.mockResolvedValue([
      { id: "a", resena_padre_id: null, calificacion: 4, fecha: "2026-10-16", autor: AUTOR },
      { id: "b", resena_padre_id: null, calificacion: 5, fecha: "2026-10-15", autor: AUTOR },
    ]);

    renderizar();

    expect(await screen.findByText("4.5")).toBeTruthy();
    expect(screen.getByText("2 reseñas")).toBeTruthy();
  });

  it("avisa cuando todavía nadie reseñó", async () => {
    apiFetchMock.mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText("Sin reseñas")).toBeTruthy();
  });

  it("no muestra nada fuera de una ficha", () => {
    const { container } = render(<PuntajeComunidad />);

    expect(container.innerHTML).toBe("");
  });
});
