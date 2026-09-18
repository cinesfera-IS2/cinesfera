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
    const detalle =
      (cuerpo && typeof cuerpo.detail === "string" && cuerpo.detail) ||
      `Error ${response.status}`;

    throw new ApiError(response.status, detalle);
  }

  return cuerpo as T;
}
