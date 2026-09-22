/**
 * Todavía no hay sesión en el frontend: el formulario de login no envía nada y
 * no se guarda ningún token, así que ningún perfil puede reconocerse como
 * propio y todos se ven como visitante.
 *
 * Cuando exista el login, esto tiene que leer el token de la cookie con
 * `cookies()` de `next/headers`, resolver quién es con `GET /auth/me` y
 * comparar **por id de usuario**, no por nombre de usuario: el nombre se puede
 * cambiar desde el propio formulario de edición del perfil.
 */
export async function esMiPerfil(nombreUsuario: string): Promise<boolean> {
  // El parámetro se conserva porque es contra lo que va a comparar la sesión.
  void nombreUsuario;

  return false;
}
