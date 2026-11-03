export type PosicionFoto = {
  x: number;
  y: number;
};

const TAMANO_SALIDA = 512;

export function calcularAreaRecorte(
  ancho: number,
  alto: number,
  posicion: PosicionFoto
) {
  const lado = Math.min(ancho, alto);
  return {
    x: ((ancho - lado) * posicion.x) / 100,
    y: ((alto - lado) * posicion.y) / 100,
    lado,
  };
}

/** Genera el avatar cuadrado que se persistirá en el backend. */
export async function recortarFotoPerfil(
  archivo: File,
  posicion: PosicionFoto
): Promise<File> {
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await cargarImagen(url);
    const recorte = calcularAreaRecorte(
      imagen.naturalWidth,
      imagen.naturalHeight,
      posicion
    );
    const lienzo = document.createElement("canvas");
    lienzo.width = TAMANO_SALIDA;
    lienzo.height = TAMANO_SALIDA;
    const contexto = lienzo.getContext("2d");
    if (!contexto) throw new Error("No se pudo preparar el recorte de la foto");

    contexto.imageSmoothingEnabled = true;
    contexto.imageSmoothingQuality = "high";
    contexto.drawImage(
      imagen,
      recorte.x,
      recorte.y,
      recorte.lado,
      recorte.lado,
      0,
      0,
      TAMANO_SALIDA,
      TAMANO_SALIDA
    );

    const blob = await convertirEnBlob(lienzo);
    const extension = blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `foto-perfil.${extension}`, {
      type: blob.type,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada"));
    imagen.src = url;
  });
}

function convertirEnBlob(lienzo: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    lienzo.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo recortar la foto seleccionada"));
      },
      "image/webp",
      0.92
    );
  });
}
