import { cookies } from "next/headers";
import { cache } from "react";

import { ApiError, apiFetch } from "@/lib/api";

/** Lo que devuelve `GET /auth/me` y la interfaz usa de la persona logueada. */
export type UsuarioSesion = {
  id: string;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  foto_url: string | null;
};

/**
 * Resuelve quién tiene la sesión abierta, o `null` si no hay nadie.
 *
 * La cookie httpOnly llega al servidor de Next gracias al proxy `/api` (ver
 * lib/api.ts), pero el fetch del servidor va directo al backend, así que hay
 * que reenviarla a mano. Va envuelta en `cache` porque la cabecera y la página
 * la piden por separado en el mismo request.
 */
export const obtenerSesion = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return null;
  }

  try {
    return await apiFetch<UsuarioSesion>("/auth/me", {
      headers: { Cookie: `access_token=${token}` },
      cache: "no-store",
    });
  } catch (error) {
    // Token vencido o usuario borrado: se navega como visitante sin ruido.
    // Cualquier otra falla también, pero queda registrada: esto corre en la
    // cabecera de todas las páginas, y que /auth/me falle no debería tirar
    // abajo contenido que es público.
    if (!(error instanceof ApiError && error.status === 401)) {
      console.error("No se pudo resolver la sesión", error);
    }

    return null;
  }
});
