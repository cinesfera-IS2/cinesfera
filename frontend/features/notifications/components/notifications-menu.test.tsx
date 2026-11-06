import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";

import { NotificationsMenu } from "./notifications-menu";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogo",
  useRouter: () => ({ push }),
}));
vi.mock("@/lib/api", () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string
    ) {
      super(message);
    }
  }
  return { ApiError, apiFetch: vi.fn() };
});

const notificacion = {
  id: "n1",
  tipo: "nuevo_seguidor" as const,
  leida: false,
  fecha: "2026-11-06T12:00:00Z",
  actor: {
    id: "u2",
    nombre: "Ana",
    apellido: "Torres",
    nombre_usuario: "anatorres",
    foto_url: null,
  },
};

describe("NotificationsMenu", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockImplementation(async (ruta) => {
      if (ruta === "/notificaciones") {
        return { items: [notificacion], no_leidas: 1 } as never;
      }
      if (ruta === "/auth/csrf") {
        return { csrf_token: "csrf-prueba" } as never;
      }
      return null as never;
    });
  });

  afterEach(() => {
    cleanup();
    push.mockReset();
    vi.mocked(apiFetch).mockReset();
  });

  it("muestra el contador y quién comenzó a seguir al usuario", async () => {
    render(<NotificationsMenu />);

    expect(
      await screen.findByRole("button", {
        name: "Notificaciones, 1 sin leer",
      })
    ).toBeTruthy();
    expect(screen.getByText("Ana Torres")).toBeTruthy();
    expect(screen.getByText(/comenzó a seguirte/)).toBeTruthy();
    expect(screen.getByLabelText("Sin leer")).toBeTruthy();
  });

  it("marca una notificación y abre el perfil del seguidor", async () => {
    render(<NotificationsMenu />);
    const usuario = userEvent.setup();
    const item = await screen.findByRole("button", {
      name: /Ana Torres comenzó a seguirte/,
    });

    await usuario.click(item);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/notificaciones/n1/leer", {
        method: "PATCH",
        headers: { "X-CSRF-Token": "csrf-prueba" },
      });
    });
    expect(push).toHaveBeenCalledWith("/profile/anatorres");
    expect(screen.queryByLabelText("Sin leer")).toBeNull();
  });

  it("permite marcar todas como leídas", async () => {
    render(<NotificationsMenu />);
    const usuario = userEvent.setup();

    await usuario.click(await screen.findByRole("button", { name: "Marcar todas" }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith("/notificaciones/leer-todas", {
        method: "PATCH",
        headers: { "X-CSRF-Token": "csrf-prueba" },
      });
    });
    expect(
      screen.getByRole("button", { name: "Notificaciones, 0 sin leer" })
    ).toBeTruthy();
  });
});
