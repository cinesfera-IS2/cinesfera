/**
 * Sesión simulada mientras no exista el login.
 *
 * Es `async` porque va a pasar a leer la cookie del token con `cookies()` de
 * `next/headers`, y así ese cambio no toca a quien la llama. Poniendo
 * `SESION` en `null` todos los perfiles se ven como visitante.
 */

const SESION: { nombreUsuario: string } | null = {
  nombreUsuario: "juanmorena",
};

export async function esMiPerfil(nombreUsuario: string): Promise<boolean> {
  return SESION?.nombreUsuario === nombreUsuario;
}
