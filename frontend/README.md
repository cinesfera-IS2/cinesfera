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

La URL del backend **no se escribe a mano en ningún componente**. Sale de la
variable `NEXT_PUBLIC_API_URL`, y Next.js elige el archivo según el comando:

| Comando | Archivo que lee | A dónde apunta |
| --- | --- | --- |
| `pnpm dev` | `.env.development` | `http://localhost:8000` |
| `pnpm build` / `pnpm start` | `.env.production` | `https://cinesfera.onrender.com` |

Los dos archivos **se versionan**, porque solo tienen URLs públicas. No hay que
copiar ni configurar nada al clonar el repo: `pnpm dev` ya apunta a tu backend
local y `pnpm build` al deployado.

Si necesitás apuntar a otro lado **solo para vos** (por ejemplo, el backend en
otro puerto), creá un `.env.local`: tiene prioridad sobre los dos y no se
versiona.

> ⚠️ Ojo con `.env.local`: Next.js lo lee **también** en `pnpm build`, y pisa a
> `.env.production`. Por eso la URL de desarrollo vive en `.env.development` y
> no en `.env.local`; si no, el build de producción terminaría apuntando a
> `localhost`.

Para hablar con la API, usá los helpers de `lib/api.ts`:

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

**No hay que cargar ninguna variable en el dashboard de Vercel.** La URL del
backend ya viene en `.env.production`, que está versionado, así que `next build`
la toma sola en cada deploy.

Si en algún momento quieren manejarla desde el dashboard igual
(Vercel → Settings → Environment Variables), una `NEXT_PUBLIC_API_URL` cargada
ahí **le gana** a `.env.production`. Sirve para apuntar un entorno a otro backend
sin tocar el repo, pero ojo con que las dos fuentes queden desincronizadas.

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
├── .env.development    # URL del backend para `pnpm dev` (se versiona)
├── .env.production     # URL del backend deployado, para `pnpm build`
├── package.json
└── next.config.ts
```

## Nota sobre el gestor de paquetes

Este proyecto usa **pnpm**. Evitá correr `npm install` o `yarn install`, ya que generan su propio lockfile y pueden causar inconsistencias entre los entornos del equipo. Si ves un `package-lock.json` en tu carpeta, es un resabio de una instalación con `npm` y se puede borrar sin problema una vez que tengas `pnpm install` corrido.
