# Frontend (Next.js)

## Requisitos

- [Node.js](https://nodejs.org/) 20 o superior (recomendado: la última LTS)
- [pnpm](https://pnpm.io/) como gestor de paquetes del proyecto

Si no tenés `pnpm` instalado:

```bash
npm install -g pnpm
```

## Puesta en marcha (primera vez)

1. Parate en la carpeta `frontend`:

   ```bash
   cd frontend
   ```

2. Instalá las dependencias:

   ```bash
   pnpm install
   ```

## Conexión con el backend

La URL del backend **no se escribe a mano en ningún componente**: sale de la
variable `NEXT_PUBLIC_API_URL`.

Los archivos `.env` **no se versionan**, así que cada entorno define la suya:

| Entorno | De dónde sale el valor | A dónde apunta |
| --- | --- | --- |
| Local (`pnpm dev`) | Tu `.env.local` | `http://localhost:8000` |
| Deploy (Vercel) | Vercel → Settings → Environment Variables | `https://cinesfera.onrender.com` |

### Primera vez

```bash
cp .env.example .env.local
```

`.env.local` es tuyo y no se sube al repo. Si apuntás tu backend a otro puerto,
lo cambiás ahí y no afecta a nadie más.

> Si no creás el archivo igual funciona: `lib/api.ts` cae por defecto a
> `http://localhost:8000`. El fallback existe solo para desarrollo — en un build
> de producción, si falta la variable, el build **falla a propósito** en vez de
> generar un bundle que apunte a `localhost`.

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

> Si levantás el frontend en un puerto distinto de 3000, agregá ese origen a
> `CORS_ORIGINS` en `backend/.env` o el navegador va a bloquear las llamadas.

## Deploy en Vercel

El frontend está publicado en **https://cinesfera-three.vercel.app**, y habla con
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

## Levantar el servidor de desarrollo

```bash
pnpm dev
```

La app queda disponible en http://localhost:3000, con recarga automática al guardar cambios.

## Otros comandos disponibles

```bash
pnpm build   # compila la app para producción
pnpm start   # levanta el build de producción (requiere haber corrido pnpm build antes)
pnpm lint    # corre el linter (ESLint)
```

## Estructura del proyecto

```
frontend/
├── app/                # Rutas y páginas (App Router de Next.js)
│   ├── layout.tsx
│   └── page.tsx
├── features/           # Módulos por dominio (landing, auth, ...)
├── lib/
│   └── api.ts          # URL del backend + helpers de fetch
├── public/             # Archivos estáticos
├── .env.example        # Plantilla (lo único .env que se versiona)
├── .env.local          # Tu config local (NO se versiona)
├── package.json
└── next.config.ts
```

## Nota sobre el gestor de paquetes

Este proyecto usa **pnpm**. Evitá correr `npm install` o `yarn install`, ya que generan su propio lockfile y pueden causar inconsistencias entre los entornos del equipo. Si ves un `package-lock.json` en tu carpeta, es un resabio de una instalación con `npm` y se puede borrar sin problema una vez que tengas `pnpm install` corrido.
