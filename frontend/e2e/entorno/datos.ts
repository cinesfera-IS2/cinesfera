// Datos y atajos compartidos por los tests e2e. Todo se crea por la API del
// backend de prueba, nunca a mano en la base.

import { expect, request, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";

export const PASSWORD_DE_PRUEBA = "Contraseña-Segura-123!";

/** Cuenta que se crea antes de correr los tests (ver global-setup.ts). */
export const USUARIO_EXISTENTE = {
  nombre: "Usuario",
  apellido: "Existente",
  nombre_usuario: "e2e_existente",
  email: "e2e.existente@example.com",
  password: PASSWORD_DE_PRUEBA,
};

// Las mismas credenciales que ADMIN_INICIAL_* en backend.mjs.
const ADMIN = { identificador: "admin_e2e", password: "Admin-E2E-Cinesfera-123" };

export type DatosUsuario = typeof USUARIO_EXISTENTE;

/** Datos válidos que no chocan con ninguna otra corrida ni test en paralelo. */
export function datosUsuarioNuevo(cambios: Partial<DatosUsuario> = {}): DatosUsuario {
  const id = crypto.randomUUID().slice(0, 8);
  return {
    nombre: "Ana",
    apellido: "Torres",
    nombre_usuario: `e2e_${id}`,
    email: `e2e.${id}@example.com`,
    password: PASSWORD_DE_PRUEBA,
    ...cambios,
  };
}

function apiBackend(): Promise<APIRequestContext> {
  return request.newContext({ baseURL: process.env.E2E_URL_BACKEND });
}

async function esperarOk(respuesta: APIResponse, accion: string) {
  if (!respuesta.ok()) {
    throw new Error(`${accion} falló (${respuesta.status()}): ${await respuesta.text()}`);
  }
}

type Credenciales = { identificador: string; password: string };
type Encabezados = Record<string, string>;

/** Inicia sesión por la API y le pasa a `accion` el cliente y el encabezado CSRF. */
async function conSesion<T>(
  credenciales: Credenciales,
  accion: (api: APIRequestContext, csrf: Encabezados) => Promise<T>
): Promise<T> {
  const api = await apiBackend();
  try {
    const login = await api.post("/auth/login", { data: credenciales });
    await esperarOk(login, `Login de ${credenciales.identificador}`);
    const { csrf_token } = await login.json();
    return await accion(api, { "X-CSRF-Token": csrf_token });
  } finally {
    await api.dispose();
  }
}

function credencialesDe(usuario: DatosUsuario): Credenciales {
  return { identificador: usuario.email, password: usuario.password };
}

/** Registra una cuenta; devuelve su id. Un 409 (ya existía) no es error. */
export async function crearUsuario(datos: DatosUsuario): Promise<string | undefined> {
  const api = await apiBackend();
  try {
    const respuesta = await api.post("/auth/register", { data: datos });
    if (respuesta.status() === 409) return undefined;
    await esperarOk(respuesta, `Registrar a ${datos.nombre_usuario}`);
    return (await respuesta.json()).id;
  } finally {
    await api.dispose();
  }
}

/** Registra una cuenta que no existía; devuelve sus datos y su id. */
export async function crearUsuarioNuevo(cambios: Partial<DatosUsuario> = {}) {
  const datos = datosUsuarioNuevo(cambios);
  const id = await crearUsuario(datos);
  if (!id) throw new Error(`${datos.nombre_usuario} ya existía`);
  return { ...datos, id };
}

type CambiosPerfil = { bio?: string; ubicacion?: string; generos_favoritos?: string[] };

export async function actualizarPerfil(usuario: DatosUsuario & { id: string }, cambios: CambiosPerfil) {
  await conSesion(credencialesDe(usuario), async (api, csrf) => {
    const respuesta = await api.patch(`/usuarios/${usuario.id}/perfil`, { headers: csrf, data: cambios });
    await esperarOk(respuesta, "Actualizar el perfil");
  });
}

type NuevaResena = {
  tipo: "pelicula" | "serie";
  tmdbId: number;
  texto: string;
  /** Obligatoria en una reseña original; en una respuesta, omitirla. */
  calificacion?: number;
  /** Si se indica, es una respuesta a esa reseña. */
  resenaPadreId?: string;
};

/** Publica una reseña o una respuesta como `usuario`; devuelve su id. */
export async function publicarResena(usuario: DatosUsuario & { id: string }, resena: NuevaResena) {
  return conSesion(credencialesDe(usuario), async (api, csrf) => {
    const respuesta = await api.post(`/contenidos/${resena.tipo}/${resena.tmdbId}/resenas`, {
      headers: csrf,
      data: {
        usuario_id: usuario.id,
        texto: resena.texto,
        calificacion: resena.calificacion ?? null,
        resena_padre_id: resena.resenaPadreId ?? null,
      },
    });
    await esperarOk(respuesta, "Publicar la reseña");
    return (await respuesta.json()).id as string;
  });
}

/** Suspende la cuenta indefinidamente, como lo haría un administrador. */
export async function suspenderUsuario(usuarioId: string) {
  await conSesion(ADMIN, async (api, csrf) => {
    const respuesta = await api.patch(`/usuarios/${usuarioId}/suspender`, {
      headers: csrf,
      data: {
        accion: "suspender_usuario",
        motivo: "Suspensión de un test e2e",
        tipo_suspension: "indefinida",
      },
    });
    await esperarOk(respuesta, "Suspender la cuenta");
  });
}

/**
 * Deja al navegador con la sesión iniciada sin pasar por el formulario, que ya
 * se prueba en HU1.2. Va por el proxy del frontend para que la cookie quede ahí.
 */
export async function iniciarSesion(page: Page, usuario: DatosUsuario) {
  const respuesta = await page.request.post("/api/auth/login", { data: credencialesDe(usuario) });
  expect(respuesta.ok(), `Login de ${usuario.nombre_usuario} en el navegador`).toBe(true);
}

/** Deja al navegador con la sesión del administrador principal de los tests. */
export async function iniciarSesionAdministrador(page: Page) {
  const respuesta = await page.request.post("/api/auth/login", { data: ADMIN });
  expect(respuesta.ok(), "Login del administrador en el navegador").toBe(true);
}
