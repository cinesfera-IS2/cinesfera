/**
 * Navega con una recarga completa en lugar del router de Next. Después de
 * iniciar sesión hace falta: la navegación del router reutiliza lo que ya se
 * renderizó sin la cookie, y la página llega como si no hubiera sesión.
 */
export function recargarEn(url: string): void {
  window.location.replace(url);
}
