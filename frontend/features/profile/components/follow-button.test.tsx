import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { FollowButton } from "./follow-button";
import { apiFetch } from "@/lib/api";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiFetch: vi.fn(),
}));

describe("FollowButton", () => {
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
    pushMock.mockReset();
    refreshMock.mockReset();
  });

  it("lleva al login al visitante", () => {
    render(<FollowButton usuarioId="u2" haySesion={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));

    expect(pushMock).toHaveBeenCalledWith("/login");
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("consulta el estado y permite seguir hasta formar una amistad", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        siguiendo: false,
        te_sigue: true,
        son_amigos: false,
      })
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ son_amigos: true });

    render(<FollowButton usuarioId="u2" haySesion />);

    const boton = await screen.findByRole("button", { name: "Seguir" });
    fireEvent.click(boton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Amigos" })).toBeTruthy();
    });
    expect(apiFetch).toHaveBeenNthCalledWith(
      3,
      "/usuarios/u2/seguir",
      {
        method: "POST",
        headers: { "X-CSRF-Token": "csrf-prueba" },
      }
    );
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("pide confirmación antes de romper una amistad", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        siguiendo: true,
        te_sigue: true,
        son_amigos: true,
      })
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce(null);

    render(<FollowButton usuarioId="u2" haySesion />);

    const boton = await screen.findByRole("button", { name: "Amigos" });
    fireEvent.click(boton);

    expect(screen.getByRole("dialog", { hidden: true })).toHaveProperty(
      "open",
      true
    );
    expect(
      screen.getByRole("heading", {
        name: "¿Dejar de seguir a este amigo?",
      })
    ).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Dejar de seguir" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Seguir" })).toBeTruthy();
    });
    expect(apiFetch).toHaveBeenNthCalledWith(
      3,
      "/usuarios/u2/seguir",
      {
        method: "DELETE",
        headers: { "X-CSRF-Token": "csrf-prueba" },
      }
    );
  });

  it("permite cancelar sin dejar de seguir", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      siguiendo: true,
      te_sigue: true,
      son_amigos: true,
    });

    render(<FollowButton usuarioId="u2" haySesion />);

    fireEvent.click(await screen.findByRole("button", { name: "Amigos" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("dialog", { hidden: true })).toHaveProperty(
      "open",
      false
    );
    expect(screen.getByRole("button", { name: "Amigos" })).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledTimes(1);
  });
});
