import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "@/lib/api";
import { BuscadorUsuarios } from "./buscador-usuarios";

vi.mock("@/lib/api", async (original) => ({
  ...(await original<object>()), apiFetch: vi.fn(),
}));
const usuario = { id: "1", nombre: "María", apellido: "González", nombre_usuario: "mariacine", foto_url: "https://example.com/maria.jpg" };

function buscar(texto = "María") {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: texto } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}

afterEach(() => { cleanup(); vi.resetAllMocks(); });

describe("BuscadorUsuarios", () => {
  it("no consulta hasta ingresar texto y enviar el formulario", () => {
    render(<BuscadorUsuarios />);
    buscar("   ");
    expect(apiFetch).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Buscar" }).hasAttribute("disabled")).toBe(true);
  });

  it("busca y muestra datos públicos con un enlace al perfil", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ usuarios: [usuario], hay_mas: false });
    render(<BuscadorUsuarios />);
    buscar("  María  ");
    const enlace = await screen.findByRole("link", { name: /@mariacine/ });
    expect(enlace.getAttribute("href")).toBe("/profile/mariacine");
    expect(screen.getByText("María González")).toBeTruthy();
    expect(screen.getByRole("img").getAttribute("src")).toBe(usuario.foto_url);
    expect(apiFetch).toHaveBeenCalledWith("/usuarios/buscar?q=Mar%C3%ADa&limite=20&offset=0", expect.objectContaining({ credentials: "include" }));
  });

  it("muestra y retira el estado de carga", async () => {
    let resolver!: (datos: unknown) => void;
    vi.mocked(apiFetch).mockImplementation(() => new Promise((resolve) => { resolver = resolve; }));
    render(<BuscadorUsuarios />);
    buscar();
    expect(screen.getByRole("status").textContent).toContain("Buscando usuarios");
    resolver({ usuarios: [], hay_mas: false });
    await screen.findByText(/No se encontraron usuarios/);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("permite reintentar después de un error", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("Red"))
      .mockResolvedValueOnce({ usuarios: [usuario], hay_mas: false });
    render(<BuscadorUsuarios />);
    buscar();
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("@mariacine")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("ofrece acceder cuando la sesión venció", async () => {
    vi.mocked(apiFetch).mockRejectedValue(new ApiError(401, "Sesión vencida"));
    render(<BuscadorUsuarios />);
    buscar();
    expect((await screen.findByRole("link", { name: "Acceder" })).getAttribute("href")).toBe("/login?volver=%2Fcomunidad");
  });

  it("pagina y vuelve al inicio al cambiar la búsqueda", async () => {
    vi.mocked(apiFetch).mockResolvedValue({ usuarios: [usuario], hay_mas: true });
    render(<BuscadorUsuarios />);
    buscar();
    fireEvent.click(await screen.findByRole("button", { name: "Siguiente" }));
    await screen.findByText("Página 2");
    expect(apiFetch).toHaveBeenLastCalledWith(expect.stringContaining("offset=20"), expect.anything());
    buscar("cine");
    await screen.findByText("Página 1");
    expect(apiFetch).toHaveBeenLastCalledWith(expect.stringContaining("q=cine&limite=20&offset=0"), expect.anything());
  });

  it("descarta respuestas anteriores cuando se envía otra búsqueda", async () => {
    let resolver!: (datos: unknown) => void;
    vi.mocked(apiFetch).mockImplementationOnce(() => new Promise((resolve) => { resolver = resolve; }))
      .mockResolvedValueOnce({ usuarios: [], hay_mas: false });
    render(<BuscadorUsuarios />);
    buscar("María");
    const primera = vi.mocked(apiFetch).mock.calls[0][1]?.signal;
    buscar("Pedro");
    await screen.findByText(/No se encontraron usuarios para “Pedro”/);
    expect(primera?.aborted).toBe(true);
    resolver({ usuarios: [usuario], hay_mas: false });
    await waitFor(() => expect(screen.queryByText("@mariacine")).toBeNull());
  });
});
