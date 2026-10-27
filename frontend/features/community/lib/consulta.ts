/** Mismo formato que exige el backend al registrarse. */
const NOMBRE_USUARIO = /^[a-z0-9._]{3,30}$/;

/** Acepta la arroba y mayúsculas, como suele escribirse un nombre de usuario. */
export function normalizarConsulta(valor: string | string[] | undefined): string {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  return (texto ?? "").trim().replace(/^@+/, "").toLowerCase();
}

export function esNombreUsuarioValido(consulta: string): boolean {
  return NOMBRE_USUARIO.test(consulta);
}

export function hrefComunidad(consulta: string): string {
  const normalizada = normalizarConsulta(consulta);
  return normalizada ? `/comunidad?q=${encodeURIComponent(normalizada)}` : "/comunidad";
}
