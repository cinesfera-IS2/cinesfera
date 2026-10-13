import { recargarEn } from "@/features/auth/lib/navegacion";
import { ApiError, apiFetch } from "@/lib/api";

/**
 * El logout está protegido contra CSRF, así que primero se pide el token que
 * corresponde a la cookie actual y después se manda en la cabecera.
 */
export async function cerrarSesion(): Promise<void> {
  try {
    const { csrf_token } = await apiFetch<{ csrf_token: string }>(
      "/auth/csrf",
      { cache: "no-store" }
    );

    await apiFetch("/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": csrf_token },
    });
  } catch (error) {
    // Un 401 quiere decir que la sesión ya había vencido: no queda nada que
    // cerrar y basta con recargar.
    if (!(error instanceof ApiError && error.status === 401)) {
      throw error;
    }
  }

  recargarEn("/");
}
