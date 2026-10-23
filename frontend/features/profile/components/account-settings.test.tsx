import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { AccountSettings } from "./account-settings";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiFetch: vi.fn(),
}));

describe("AccountSettings", () => {
  afterEach(() => {
    cleanup();
    vi.mocked(apiFetch).mockReset();
    refreshMock.mockReset();
  });

  it("actualiza el correo con protección CSRF", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce({ email: "nuevo@example.com" });
    render(<AccountSettings usuarioId="u1" email="ana@example.com" />);

    const email = screen.getByLabelText("Correo electrónico");
    await userEvent.clear(email);
    await userEvent.type(email, "nuevo@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Actualizar correo" }));

    expect((await screen.findByRole("status")).textContent).toBe(
      "Correo actualizado correctamente."
    );
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/usuarios/u1/perfil", {
      method: "PATCH",
      headers: { "X-CSRF-Token": "csrf-prueba" },
      body: JSON.stringify({ email: "nuevo@example.com" }),
    });
    expect(refreshMock).toHaveBeenCalledOnce();
  });

  it("valida la confirmación antes de cambiar la contraseña", async () => {
    render(<AccountSettings usuarioId="u1" email="ana@example.com" />);

    await userEvent.type(screen.getByLabelText("Contraseña actual"), "ClaveActual123!");
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "NuevaClave456!");
    await userEvent.type(
      screen.getByLabelText("Confirmar contraseña nueva"),
      "NoCoincide456!"
    );
    await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Las contraseñas nuevas no coinciden."
    );
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("cambia la contraseña y limpia el formulario", async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({ csrf_token: "csrf-prueba" })
      .mockResolvedValueOnce(null);
    render(<AccountSettings usuarioId="u1" email="ana@example.com" />);

    await userEvent.type(screen.getByLabelText("Contraseña actual"), "ClaveActual123!");
    await userEvent.type(screen.getByLabelText("Contraseña nueva"), "NuevaClave456!");
    await userEvent.type(
      screen.getByLabelText("Confirmar contraseña nueva"),
      "NuevaClave456!"
    );
    await userEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));

    await waitFor(() => {
      expect(screen.getByText("Contraseña actualizada correctamente.")).toBeTruthy();
    });
    expect(apiFetch).toHaveBeenNthCalledWith(2, "/usuarios/u1/password", {
      method: "PATCH",
      headers: { "X-CSRF-Token": "csrf-prueba" },
      body: JSON.stringify({
        password_actual: "ClaveActual123!",
        password_nueva: "NuevaClave456!",
      }),
    });
    expect(
      (screen.getByLabelText("Contraseña nueva") as HTMLInputElement).value
    ).toBe("");
  });
});
