/**
 * Punto único donde vive la URL del backend.
 *
 * El valor sale de `NEXT_PUBLIC_API_URL`. Los archivos `.env` no se
 * versionan, así que cada entorno la define por su cuenta:
 *   - local  -> `.env.local` (copiá `.env.example`), o el fallback de abajo
 *   - deploy -> Vercel → Settings → Environment Variables
 *
 * Nadie más debería escribir la URL del backend a mano.
 */

const URL_CONFIGURADA = process.env.NEXT_PUBLIC_API_URL;

// En un build de producción la variable es obligatoria: si faltara,
// el bundle saldría apuntando a localhost y la app quedaría rota en
// silencio, con un error dificilísimo de diagnosticar desde el navegador.
// Mejor romper el build acá.
if (!URL_CONFIGURADA && process.env.NODE_ENV === "production") {
  throw new Error(
    "Falta la variable NEXT_PUBLIC_API_URL. " +
      "Cargala en Vercel → Settings → Environment Variables " +
      "con la URL del backend (https://cinesfera.onrender.com)."
  );
}

const API_URL = (URL_CONFIGURADA ?? "http://localhost:8000").replace(
  /\/$/,
  ""
);

export { API_URL };

/** Arma la URL absoluta de un endpoint: apiUrl("/auth/login"). */
export function apiUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * `fetch` contra el backend, con la URL base ya resuelta y el manejo de
 * errores de FastAPI (que responde `{ "detail": "..." }`).
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const cuerpo = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, mensajeDeError(cuerpo, response.status));
  }

  return cuerpo as T;
}

/**
 * FastAPI manda `detail` como texto en los errores propios (401, 404, 409...) y
 * como lista de fallos de validación en los 422 de Pydantic. Sin este segundo
 * caso, un 422 llegaría a la pantalla como un "Error 422" sin explicación.
 */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const detalle =
    cuerpo && typeof cuerpo === "object" && "detail" in cuerpo
      ? (cuerpo as { detail: unknown }).detail
      : undefined;

  if (typeof detalle === "string") {
    return detalle;
  }

  if (Array.isArray(detalle)) {
    const mensajes = detalle
      .map((fallo) =>
        fallo && typeof fallo === "object" && typeof fallo.msg === "string"
          ? fallo.msg
          : null
      )
      .filter((mensaje): mensaje is string => mensaje !== null);

    if (mensajes.length > 0) {
      return mensajes.join(". ");
    }
  }

  return `Error ${status}`;
}
