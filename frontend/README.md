# Frontend (Next.js)

Interfaz web de Cinesfera: Next.js 16 (App Router), React 19 y Tailwind 4.

## Cómo levantar el servidor

### Requisitos

| | Obligatorio | Cómo instalarlo |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) 20.9 o superior | Sí | Bajá la última LTS |
| [pnpm](https://pnpm.io/) | Sí | `npm install -g pnpm` |
| El backend corriendo en http://localhost:8000 | Para ver datos | Ver [`backend/README.md`](../backend/README.md) |

> Usá **solo pnpm**. `npm install` o `yarn install` generan otro lockfile y
> desincronizan las dependencias del equipo. Si ves un `package-lock.json`, es
> un resabio de una instalación con npm.

### Primera vez

1. Parate en la carpeta `frontend`:

   ```bash
   cd frontend
   ```

2. Instalá las dependencias:

   ```bash
   pnpm install
   ```

3. Levantá el servidor:

   ```bash
   pnpm dev
   ```

La app queda en http://localhost:3000 y se recarga sola al guardar cambios.

### Día a día

```bash
cd frontend
pnpm dev
```

Volvé a correr `pnpm install` solo si alguien agregó o actualizó dependencias
(cambió `package.json` o `pnpm-lock.yaml`).

## Comandos disponibles

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo en el puerto 3000 |
| `pnpm build` | Compila la app para producción |
| `pnpm start` | Levanta el build de producción (antes hay que correr `pnpm build`) |
| `pnpm lint` | Corre ESLint |
| `pnpm test` | Tests de Vitest; se repiten cada vez que guardás un archivo |
| `pnpm test:run` | Tests de Vitest, una sola vez |
| `pnpm test:coverage` | Tests de Vitest con reporte de cobertura |
| `pnpm test:e2e` | Tests end-to-end de Playwright |
| `pnpm test:e2e:ui` | Tests end-to-end con la interfaz de Playwright, paso a paso |
| `pnpm test:e2e:grabar` | Abre el grabador de Playwright sobre `localhost:3000` |

## Conexión con el backend

La URL del backend **no se escribe a mano en ningún componente**: sale de la
variable `NEXT_PUBLIC_API_URL`, que se define en cada entorno.

| Entorno | De dónde sale el valor | A dónde apunta |
| --- | --- | --- |
| Local (`pnpm dev`) | Valor por defecto de `lib/api.ts` | `http://localhost:8000` |
| Deploy (Vercel) | Vercel → Settings → Environment Variables | `https://cinesfera.onrender.com` |

El valor por defecto existe solo para desarrollo: en un build de producción, si
falta la variable, el build **falla a propósito** para no publicar una app que
apunte a `localhost`.

> Si levantás el frontend en un puerto distinto de 3000, agregá ese origen a
> `CORS_ORIGINS` en `backend/.env` o el navegador va a bloquear las llamadas.

### Cómo llamar a la API

Usá los helpers de `lib/api.ts`:

```ts
import { apiFetch } from "@/lib/api";

const usuario = await apiFetch<UsuarioRespuesta>("/auth/login", {
  method: "POST",
  body: JSON.stringify({ identificador, password }),
});
```

`apiFetch` ya resuelve la URL base y convierte el `{ "detail": "..." }` de
FastAPI en un `ApiError` con `status` y `message`. Si necesitás solo la URL,
`apiUrl("/auth/login")` te la arma.

## Tests

### Unitarios y de componentes (Vitest)

```bash
pnpm test:run
```

Usan [Vitest](https://vitest.dev) y
[Testing Library](https://testing-library.com/docs/react-testing-library/intro).
Viven al lado del archivo que prueban, con el mismo nombre terminado en
`.test.ts` o `.test.tsx` (`password.ts` → `password.test.ts`), y Vitest los
encuentra solo.

No necesitan el backend levantado: cuando el código llama a la API, el test
reemplaza `fetch` por una función falsa (`vi.stubGlobal("fetch", ...)`) que
devuelve la respuesta que el caso necesita, por ejemplo un `409` con
"El email ya está registrado". Ver `lib/api.test.ts`.

Hay dos tipos:

- **Lógica pura** (`password.test.ts`, `fechas.test.ts`, `api.test.ts`): se
  llama a la función y se compara el resultado con `expect(...).toBe(...)`.
- **Componentes** (`register-form.test.tsx`): se dibuja el componente con
  `render`, se lo usa como una persona (`userEvent.type`, `userEvent.click`,
  buscando los campos por su etiqueta visible) y se comprueba qué se mandó al
  backend y qué se muestra en pantalla.

`vi.mock("next/navigation", ...)` reemplaza el router de Next, que no existe
fuera de la app, por uno falso para poder verificar a dónde quiso navegar.

### End-to-end (Playwright)

```bash
pnpm test:e2e
```

La primera vez, instalá el navegador que usa Playwright (una vez por máquina):

```bash
pnpm exec playwright install chromium
```

Viven en `e2e/`, uno por historia de usuario (`e2e/HU1.1/registro.spec.ts`),
y usan la app de verdad en un navegador. **Nunca tocan Supabase**: el comando
arranca todo solo (`e2e/entorno/`) y lo apaga al terminar.

1. Un **Postgres propio**, que se instala con `pnpm install` (paquete
   `embedded-postgres`, sin Docker). Arranca vacío en cada corrida y se borra
   al terminar.
2. El **backend del repo** conectado a esa base, en el puerto 8100. Si
   `backend/.venv` no existe, lo crea e instala `requirements.txt`; solo hace
   falta tener Python 3. De tu `backend/.env` solo toma el token de TMDB, que
   usan los tests del catálogo.
3. El **frontend** en el puerto 3100, así podés tener tu `pnpm dev` de siempre
   abierto en el 3000 al mismo tiempo.

Tienen que estar libres los puertos 3100, 8100 y 54329.

Cada test arma los datos que necesita con los helpers de
`e2e/entorno/datos.ts`, que usan la API del backend de prueba: `crearUsuarioNuevo`,
`actualizarPerfil`, `publicarResena`, `suspenderUsuario` e `iniciarSesion` (deja
al navegador logueado sin pasar por el formulario). Los usuarios nuevos llevan un
nombre único, así los tests pueden correr en paralelo sin pisarse.

Antes de empezar ya existen el usuario `e2e_existente` (lo crea
`e2e/entorno/global-setup.ts`) y un administrador, `admin_e2e` /
`Admin-E2E-Cinesfera-123` (lo crea el backend de prueba al arrancar).

## Panel de administración

Una sesión con rol `admin` se redirige a `/admin` después del login. El panel
permite filtrar reportes por tipo, estado, motivo, fechas, texto y cantidad de
denuncias; revisar el snapshot original; aplicar o revertir moderación; consultar
usuarios y ver el historial de auditoría. El administrador principal también
puede crear otros administradores o quitarles el rol.

Las acciones mutables obtienen primero el token CSRF de `/auth/csrf`. Ocultar o
suspender nunca sucede al enviar un reporte: requiere una acción explícita desde
el panel.

## Deploy en Vercel

El frontend está publicado en **https://cinesfera-three.vercel.app** y habla con
el backend de Render (**https://cinesfera.onrender.com**).

Hay que cargar **una sola variable** en Vercel → Settings → Environment
Variables:

| Variable | Valor | Entornos |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://cinesfera.onrender.com` | Production, Preview, Development |

Conviene marcar los tres entornos: si no, los *preview deployments* de las ramas
quedan sin la variable y el build falla.

> Si cambia la URL del frontend, hay que actualizar `CORS_ORIGINS` en Render
> (ver `backend/README.md`), o el navegador va a bloquear las llamadas.

## Estructura del proyecto

```
frontend/
├── app/                # Rutas y páginas (App Router de Next.js)
├── features/           # Módulos por dominio: auth, catalog, content, profile, admin...
├── lib/
│   └── api.ts          # URL del backend + helpers de fetch
├── e2e/                # Tests end-to-end de Playwright
│   └── entorno/        # Base, backend y datos que arman los tests e2e
├── public/             # Archivos estáticos
├── .env.example        # Plantilla de variables (el único .env que se versiona)
├── playwright.config.ts
├── package.json
└── next.config.ts
```
