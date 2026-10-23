export const DESTINO_POR_DEFECTO = "/catalogo";

const ORIGEN_PROPIO = "https://cinesfera.invalid";

/**
 * A dónde volver después de iniciar sesión o registrarse. Solo se aceptan rutas
 * del propio sitio: un `?volver=//otro-sitio.com` armado por terceros no puede
 * sacar a nadie de Cinesfera. Se resuelve con `URL` en lugar de mirar el texto
 * porque el navegador también trata `/\otro-sitio.com` o tabs intercalados
 * como direcciones externas.
 */
export function destinoTrasAcceder(volver: string | string[] | null | undefined): string {
  const valor = Array.isArray(volver) ? volver[0] : volver;

  if (!valor?.startsWith("/")) {
    return DESTINO_POR_DEFECTO;
  }

  let url: URL;
  try {
    url = new URL(valor, ORIGEN_PROPIO);
  } catch {
    return DESTINO_POR_DEFECTO;
  }

  if (url.origin !== ORIGEN_PROPIO || /^\/(login|register)\/?$/.test(url.pathname)) {
    return DESTINO_POR_DEFECTO;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Link a /login o /register que recuerda `volver`. Desde la portada no se
 * guarda nada: entrar desde ahí no es por una acción puntual, así que va al
 * destino por defecto.
 */
export function hrefAcceso(ruta: "/login" | "/register", volver?: string | null): string {
  const destino = destinoTrasAcceder(volver);

  if (destino === DESTINO_POR_DEFECTO || destino === "/") {
    return ruta;
  }

  return `${ruta}?${new URLSearchParams({ volver: destino })}`;
}
