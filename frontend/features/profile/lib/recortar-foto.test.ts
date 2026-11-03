import { afterEach, describe, expect, it, vi } from "vitest";

import { calcularAreaRecorte, recortarFotoPerfil } from "./recortar-foto";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("calcularAreaRecorte", () => {
  it("mueve horizontalmente el recorte de una imagen apaisada", () => {
    expect(calcularAreaRecorte(1200, 800, { x: 25, y: 50 })).toEqual({
      x: 100,
      y: 0,
      lado: 800,
    });
  });

  it("mueve verticalmente el recorte de una imagen vertical", () => {
    expect(calcularAreaRecorte(600, 1000, { x: 50, y: 75 })).toEqual({
      x: 0,
      y: 300,
      lado: 600,
    });
  });
});

describe("recortarFotoPerfil", () => {
  function prepararImagen({ falla = false } = {}) {
    class ImagenPrueba {
      naturalWidth = 1200;
      naturalHeight = 800;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_url: string) {
        queueMicrotask(() =>
          falla ? this.onerror?.() : this.onload?.()
        );
      }
    }
    vi.stubGlobal("Image", ImagenPrueba);
  }

  function prepararUrl() {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:original");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  }

  function prepararLienzo(blob: Blob | null, conContexto = true) {
    const drawImage = vi.fn();
    const contexto = {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: "low",
      drawImage,
    };
    const lienzo = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => (conContexto ? contexto : null)),
      toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
    };
    vi.spyOn(document, "createElement").mockReturnValue(
      lienzo as unknown as HTMLCanvasElement
    );
    return { contexto, drawImage, lienzo };
  }

  it("recorta, suaviza y convierte la imagen a WebP", async () => {
    prepararImagen();
    prepararUrl();
    const salida = new Blob(["webp"], { type: "image/webp" });
    const { contexto, drawImage, lienzo } = prepararLienzo(salida);
    const original = new File(["original"], "foto.jpg", { type: "image/jpeg" });

    const resultado = await recortarFotoPerfil(original, { x: 25, y: 50 });

    expect(resultado.name).toBe("foto-perfil.webp");
    expect(resultado.type).toBe("image/webp");
    expect(lienzo.width).toBe(512);
    expect(lienzo.height).toBe(512);
    expect(contexto.imageSmoothingEnabled).toBe(true);
    expect(contexto.imageSmoothingQuality).toBe("high");
    expect(drawImage).toHaveBeenCalledWith(
      expect.anything(),
      100,
      0,
      800,
      800,
      0,
      0,
      512,
      512
    );
    expect(lienzo.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      "image/webp",
      0.92
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
  });

  it("usa PNG cuando el navegador no devuelve WebP", async () => {
    prepararImagen();
    prepararUrl();
    prepararLienzo(new Blob(["png"], { type: "image/png" }));

    const resultado = await recortarFotoPerfil(
      new File(["original"], "foto.png"),
      { x: 50, y: 50 }
    );

    expect(resultado.name).toBe("foto-perfil.png");
    expect(resultado.type).toBe("image/png");
  });

  it("informa cuando no puede leer la imagen", async () => {
    prepararImagen({ falla: true });
    prepararUrl();

    await expect(
      recortarFotoPerfil(new File(["x"], "rota.png"), { x: 50, y: 50 })
    ).rejects.toThrow("No se pudo leer la imagen seleccionada");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:original");
  });

  it("informa cuando no puede crear el contexto de dibujo", async () => {
    prepararImagen();
    prepararUrl();
    prepararLienzo(null, false);

    await expect(
      recortarFotoPerfil(new File(["x"], "foto.png"), { x: 50, y: 50 })
    ).rejects.toThrow("No se pudo preparar el recorte de la foto");
  });

  it("informa cuando el navegador no genera el archivo recortado", async () => {
    prepararImagen();
    prepararUrl();
    prepararLienzo(null);

    await expect(
      recortarFotoPerfil(new File(["x"], "foto.png"), { x: 50, y: 50 })
    ).rejects.toThrow("No se pudo recortar la foto seleccionada");
  });
});
