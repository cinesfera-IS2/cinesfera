import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UsuarioAdmin } from "@/features/admin/types";
import { ApiError, apiFetch } from "@/lib/api";
import { AdministradoresSeccion } from "./administradores-seccion";
import { UsuariosSeccion } from "./usuarios-seccion";

vi.mock("@/lib/api", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/api")>();
  return { ...original, apiFetch: vi.fn() };
});

const apiFetchMock = vi.mocked(apiFetch);

const ACTIVO: UsuarioAdmin = {
  id: "usuario-activo",
  nombre: "Ana",
  apellido: "Pérez",
  nombre_usuario: "ana",
  email: "ana@example.com",
  rol: "usuario",
  estado: "activo",
  es_admin_principal: false,
  suspension_hasta: null,
  motivo_suspension: null,
  ocultar_contenido: false,
  cantidad_reportes: 2,
};

const SUSPENDIDO: UsuarioAdmin = {
  ...ACTIVO,
  id: "usuario-suspendido",
  nombre: "Beto",
  nombre_usuario: "beto",
  email: "beto@example.com",
  estado: "suspendido",
  suspension_hasta: "2026-11-05T15:00:00Z",
  motivo_suspension: "Incumplimiento reiterado",
};

const ADMIN: UsuarioAdmin = {
  ...ACTIVO,
  id: "admin-secundario",
  nombre: "Ada",
  apellido: "Admin",
  nombre_usuario: "ada.admin",
  email: "ada@example.com",
  rol: "admin",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("UsuariosSeccion", () => {
  it("muestra estados, fechas y cambia el filtro", async () => {
    const setFiltro = vi.fn();
    const indefinido = {
      ...SUSPENDIDO,
      id: "usuario-indefinido",
      nombre_usuario: "indefinido",
      suspension_hasta: null,
      motivo_suspension: null,
    };
    const eliminado = { ...ACTIVO, id: "eliminado", estado: "eliminado" as const };
    const usuario = userEvent.setup();

    render(
      <UsuariosSeccion
        usuarios={[ACTIVO, SUSPENDIDO, indefinido, eliminado]}
        filtro="todos"
        setFiltro={setFiltro}
        recargar={vi.fn()}
      />
    );

    expect(screen.getByText("Incumplimiento reiterado")).toBeTruthy();
    expect(screen.getByText("Sin motivo disponible")).toBeTruthy();
    expect(screen.getByText("Indefinida")).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: "Eliminar" })).toHaveLength(3);

    await usuario.click(screen.getByRole("button", { name: "Suspendidos" }));
    expect(setFiltro).toHaveBeenCalledWith("suspendidos");
  });

  it("suspende, reactiva y elimina usuarios enviando CSRF", async () => {
    const recargar = vi.fn().mockResolvedValue(undefined);
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf-prueba" };
      return {};
    });
    const usuario = userEvent.setup();

    render(
      <UsuariosSeccion
        usuarios={[ACTIVO, SUSPENDIDO]}
        filtro="todos"
        setFiltro={vi.fn()}
        recargar={recargar}
      />
    );

    await usuario.click(screen.getByRole("button", { name: "Suspender" }));
    await usuario.type(screen.getByLabelText("Motivo"), "  Motivo de prueba  ");
    await usuario.click(screen.getByLabelText("indefinida"));
    await usuario.click(screen.getByRole("button", { name: "Confirmar suspensión" }));

    await waitFor(() =>
      expect(apiFetchMock).toHaveBeenCalledWith(
        "/admin/usuarios/usuario-activo/accion",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-CSRF-Token": "csrf-prueba" }),
          body: expect.stringContaining('"accion":"suspender_usuario"'),
        })
      )
    );

    await usuario.click(screen.getByRole("button", { name: "Levantar suspensión" }));
    await usuario.type(screen.getByLabelText("Motivo"), "Revisión completada");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    await usuario.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    await usuario.type(screen.getByLabelText("Motivo"), "Baja administrativa");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(recargar).toHaveBeenCalledTimes(3));
    expect(apiFetchMock.mock.calls.some(([ruta, opciones]) =>
      String(ruta).endsWith("/usuario-suspendido/accion") &&
      String(opciones?.body).includes("reactivar_usuario")
    )).toBe(true);
    expect(apiFetchMock.mock.calls.some(([, opciones]) =>
      String(opciones?.body).includes("eliminar_usuario")
    )).toBe(true);
  });

  it("mantiene el diálogo abierto y muestra el error del backend", async () => {
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      throw new ApiError(409, "La cuenta ya fue eliminada");
    });
    const usuario = userEvent.setup();

    render(
      <UsuariosSeccion
        usuarios={[ACTIVO]}
        filtro="todos"
        setFiltro={vi.fn()}
        recargar={vi.fn()}
      />
    );

    await usuario.click(screen.getByRole("button", { name: "Eliminar" }));
    await usuario.type(screen.getByLabelText("Motivo"), "Intento de baja");
    await usuario.click(screen.getByRole("button", { name: "Confirmar" }));

    expect((await screen.findByRole("alert")).textContent).toContain("La cuenta ya fue eliminada");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("AdministradoresSeccion", () => {
  it("crea un administrador y recarga la lista", async () => {
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      return {};
    });
    const recargar = vi.fn().mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    render(<AdministradoresSeccion administradores={[ADMIN]} recargar={recargar} />);
    await usuario.click(screen.getByRole("button", { name: "Crear administrador" }));
    const dialogo = screen.getByRole("dialog");
    await usuario.type(screen.getByLabelText("Nombre"), "Nuevo");
    await usuario.type(screen.getByLabelText("Apellido"), "Admin");
    await usuario.type(screen.getByLabelText("Usuario"), "nuevo.admin");
    await usuario.type(screen.getByLabelText("Email"), "nuevo@example.com");
    await usuario.type(screen.getByLabelText("Contraseña"), "Clave-segura-123");
    await usuario.click(within(dialogo).getByRole("button", { name: "Crear administrador" }));

    await waitFor(() => expect(recargar).toHaveBeenCalledOnce());
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(apiFetchMock).toHaveBeenCalledWith(
      "/admin/administradores",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("respeta la confirmación al revocar y no recarga si falla", async () => {
    const confirmar = vi.spyOn(window, "confirm");
    confirmar.mockReturnValueOnce(false).mockReturnValueOnce(true);
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      throw new ApiError(409, "No se puede quitar este rol");
    });
    const usuario = userEvent.setup();

    const recargar = vi.fn();
    render(<AdministradoresSeccion administradores={[ADMIN]} recargar={recargar} />);
    const quitar = screen.getByRole("button", { name: "Quitar rol" });
    await usuario.click(quitar);
    expect(apiFetchMock).not.toHaveBeenCalled();

    await usuario.click(quitar);
    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledWith(
      "/admin/administradores/admin-secundario",
      expect.objectContaining({ method: "DELETE" })
    ));
    expect(recargar).not.toHaveBeenCalled();
  });
});
