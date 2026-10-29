import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ReporteAdmin, ReporteDetalle } from "@/features/admin/types";
import { apiFetch } from "@/lib/api";
import { AdminPanel } from "./admin-panel";
import {
  ReportesSeccion,
  type FiltrosReportes,
} from "./reportes-seccion";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

const apiFetchMock = vi.mocked(apiFetch);

const REPORTE: ReporteAdmin = {
  id: "reporte-1",
  tipo: "comentario",
  motivo: "acoso",
  descripcion: "Insultos reiterados",
  contenido_snapshot: JSON.stringify({
    texto: "Este es el contenido denunciado completo",
    autor_id: "autor-1",
    autor_usuario: "autor",
    contenido_tipo: "pelicula",
    contenido_tmdb_id: "550",
  }),
  estado: "pendiente",
  reportante_id: "reportante-1",
  reportante_usuario: "reportante",
  objetivo_id: "comentario-1",
  objetivo_usuario: "autor",
  administrador_id: null,
  resolucion: null,
  nota_interna: null,
  fecha_creacion: "2026-10-29T21:30:00Z",
  fecha_actualizacion: "2026-10-29T21:30:00Z",
  cantidad_reportes_objetivo: 2,
  reportes_descartados_reportante: 0,
};

const DETALLE: ReporteDetalle = {
  ...REPORTE,
  denunciantes: [
    {
      id: "reportante-1",
      usuario: "reportante",
      motivo: "acoso",
      descripcion: "Insultos reiterados",
      fecha: "2026-10-29T21:30:00Z",
    },
    {
      id: "reportante-2",
      usuario: "otra.persona",
      motivo: "odio",
      descripcion: null,
      fecha: "2026-10-29T21:35:00Z",
    },
  ],
  historial: [
    {
      id: "auditoria-1",
      administrador_usuario: "admin",
      accion: "actualizar_reporte",
      tipo_objetivo: "reporte",
      objetivo_id: "reporte-1",
      estado_anterior: "pendiente",
      estado_nuevo: "en_revision",
      motivo: "Caso tomado",
      nota_interna: null,
      fecha: "2026-10-29T21:40:00Z",
    },
  ],
  estado_objetivo_usuario: "activo",
  estado_contenido: "visible",
};

const FILTROS_INICIALES: FiltrosReportes = {
  tipo: "",
  estado: "pendiente",
  motivo: "",
  buscar: "",
  orden: "recientes",
  desde: "",
  hasta: "",
  cantidad_minima: "",
};

function Banco({ reportes = [REPORTE], recargar = vi.fn().mockResolvedValue(undefined) }: Readonly<{ reportes?: ReporteAdmin[]; recargar?: () => Promise<void> }>) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [pagina, setPagina] = useState(1);
  return (
    <ReportesSeccion
      filtros={filtros}
      setFiltros={setFiltros}
      reportes={reportes}
      total={reportes.length}
      pagina={pagina}
      setPagina={setPagina}
      recargar={recargar}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReportesSeccion", () => {
  it("muestra pendientes por defecto y permite ver todos desde el estado vacío", async () => {
    const usuario = userEvent.setup();
    render(<Banco reportes={[]} />);

    expect(screen.getByText("Estás al día. No hay reportes pendientes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pendientes" }).getAttribute("aria-pressed")).toBe("true");

    await usuario.click(screen.getByRole("button", { name: "Ver todos los reportes" }));

    expect(screen.getByRole("button", { name: "Todos" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("No hay reportes para estos filtros")).toBeTruthy();
  });

  it("abre el caso sin perder filtros y lo cierra con Escape restaurando el foco", async () => {
    apiFetchMock.mockResolvedValue(DETALLE);
    const usuario = userEvent.setup();
    render(<Banco />);

    expect(screen.getByRole("columnheader", { name: "Contenido denunciado" })).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);

    await usuario.selectOptions(screen.getByRole("combobox", { name: "Motivo" }), "acoso");
    const botonCaso = screen.getAllByRole("button", { name: /Ver caso/ })[0];
    await usuario.click(botonCaso);

    const dialogo = await screen.findByRole("dialog", { name: "Detalle del caso" });
    expect(dialogo.textContent).toContain("Este es el contenido denunciado completo");
    expect(dialogo.textContent).toContain("@otra.persona");
    expect(dialogo.textContent).toContain("Caso tomado");

    await usuario.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(botonCaso);
    expect((screen.getByRole("combobox", { name: "Motivo" }) as HTMLSelectElement).value).toBe("acoso");
  });

  it("actualiza el detalle y la lista al tomar un caso sin recargar la página", async () => {
    const recargar = vi.fn().mockResolvedValue(undefined);
    apiFetchMock.mockImplementation(async (ruta) => {
      if (String(ruta).includes("/detalle")) {
        const tomado = apiFetchMock.mock.calls.filter(([llamada]) => String(llamada).includes("/detalle")).length > 1;
        return tomado ? { ...DETALLE, estado: "en_revision" } : DETALLE;
      }
      if (ruta === "/auth/csrf") return { csrf_token: "csrf" };
      if (String(ruta).includes("/admin/reportes/reporte-1")) return { ...REPORTE, estado: "en_revision" };
      throw new Error(`Ruta inesperada: ${ruta}`);
    });
    const usuario = userEvent.setup();
    render(<Banco recargar={recargar} />);

    await usuario.click(screen.getAllByRole("button", { name: /Ver caso/ })[0]);
    await screen.findByRole("dialog");
    await usuario.click(screen.getByRole("button", { name: "Tomar caso" }));

    await waitFor(() => expect(recargar).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole("dialog").textContent).toContain("En revisión"));
    expect(window.location.href).toBeTruthy();
  });
});

describe("AdminPanel", () => {
  it("consulta pendientes inicialmente y usa las estadísticas como filtros", async () => {
    apiFetchMock.mockImplementation(async (ruta) => {
      if (ruta === "/admin/resumen") {
        return {
          pendientes: 3,
          en_revision: 2,
          resueltos: 4,
          descartados: 1,
          usuarios_suspendidos: 1,
        };
      }
      if (String(ruta).startsWith("/admin/reportes?")) {
        return { items: [], total: 0, pagina: 1, por_pagina: 20 };
      }
      if (String(ruta).startsWith("/admin/usuarios?")) {
        return { items: [], total: 0, pagina: 1, por_pagina: 50 };
      }
      if (String(ruta).startsWith("/admin/auditoria?")) {
        return { items: [], total: 0, pagina: 1, por_pagina: 50 };
      }
      throw new Error(`Ruta inesperada: ${ruta}`);
    });
    const usuario = userEvent.setup();

    render(
      <AdminPanel
        sesion={{
          id: "admin-1",
          nombre: "Ada",
          apellido: "Min",
          nombre_usuario: "admin",
          email: "admin@example.com",
          foto_url: null,
          rol: "admin",
        }}
      />
    );

    await screen.findByText("Estás al día. No hay reportes pendientes");
    expect(
      apiFetchMock.mock.calls.some(([ruta]) =>
        String(ruta).includes("/admin/reportes?estado=pendiente")
      )
    ).toBe(true);

    await usuario.click(screen.getAllByRole("button", { name: /En revisión/ })[0]);

    await waitFor(() =>
      expect(
        apiFetchMock.mock.calls.some(([ruta]) =>
          String(ruta).includes("/admin/reportes?estado=en_revision")
        )
      ).toBe(true)
    );
  });
});
