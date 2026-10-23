import "server-only";

import { cookies } from "next/headers";

import { obtenerListaSeguimientos } from "@/features/profile/data/perfiles";
import type { UsuarioSeguimiento } from "@/features/profile/types";

/** Obtiene los amigos del perfil propio sin exponer la cookie al navegador. */
export async function obtenerAmigosPropios(
  usuarioId: string
): Promise<UsuarioSeguimiento[]> {
  const token = (await cookies()).get("access_token")?.value;

  if (!token) {
    return [];
  }

  return obtenerListaSeguimientos(usuarioId, "amigos", {
    headers: { Cookie: `access_token=${token}` },
  });
}
