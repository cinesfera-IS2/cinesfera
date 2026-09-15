/**
 * Punto único donde vive la URL del backend.
 *
 * El valor sale de `NEXT_PUBLIC_API_URL`, que Next.js resuelve según el
 * entorno:
 *   - `next dev`   -> .env.local      -> http://localhost:8000
 *   - `next build` -> .env.production -> https://cinesfera.onrender.com
 *
 * Nadie más debería escribir la URL del backend a mano.
 */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

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
