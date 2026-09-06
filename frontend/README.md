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
├── public/             # Archivos estáticos
├── package.json
└── next.config.ts
```

## Nota sobre el gestor de paquetes

Este proyecto usa **pnpm**. Evitá correr `npm install` o `yarn install`, ya que generan su propio lockfile y pueden causar inconsistencias entre los entornos del equipo. Si ves un `package-lock.json` en tu carpeta, es un resabio de una instalación con `npm` y se puede borrar sin problema una vez que tengas `pnpm install` corrido.
