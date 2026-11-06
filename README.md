# Cinesfera

Plataforma para reseñar películas y series y seguir a otros usuarios.

| Parte | Tecnología | Carpeta | Detalle |
| --- | --- | --- | --- |
| Frontend | Next.js 16 + React 19 + Tailwind | `frontend/` | [`frontend/README.md`](frontend/README.md) |
| Backend | FastAPI + SQLAlchemy | `backend/` | [`backend/README.md`](backend/README.md) |
| Base de datos | PostgreSQL en Supabase | — | — |
| Películas y series | API de TMDB | — | — |

## Levantar el proyecto en local

Se necesitan **dos terminales**, una para cada servidor. Conviene levantar
primero el backend, porque el frontend le pide los datos a él.

### Lo que tenés que tener instalado

- [Python](https://www.python.org/downloads/) 3.10 o superior
- [Node.js](https://nodejs.org/) 20.9 o superior
- [pnpm](https://pnpm.io/): `npm install -g pnpm`
- El archivo `backend/.env` con las credenciales de la base, de TMDB y la
  clave JWT. **No está en el repo**: pedíselo al equipo.

### Terminal 1: backend → http://localhost:8000

La primera vez seguí los pasos de
[`backend/README.md`](backend/README.md#cómo-levantar-el-servidor) (crear el
entorno virtual e instalar dependencias). Después, cada día:

```bash
cd backend
source .venv/bin/activate      # Windows: .venv\Scripts\Activate.ps1
fastapi dev app/main.py
```

### Terminal 2: frontend → http://localhost:3000

```bash
cd frontend
pnpm install                   # solo la primera vez o cuando cambian dependencias
pnpm dev
```

Abrí http://localhost:3000.

## Tests

| Qué | Dónde se corre | Comando | Necesita servidores |
| --- | --- | --- | --- |
| Backend (unittest) | `backend/` con el entorno activado | `python -m unittest discover -s tests -v` | No |
| Frontend (Vitest) | `frontend/` | `pnpm test:run` | No |
| End-to-end (Playwright) | `frontend/` | `pnpm test:e2e` | No: los levanta solo, con una base propia |

Ninguno toca la base de Supabase.

## Producción

| | URL | Dónde se publica |
| --- | --- | --- |
| Frontend | https://cinesfera-three.vercel.app | Vercel |
| Backend | https://cinesfera.onrender.com | Render (`render.yaml`) |

Los dos servicios están conectados al repo. Cómo se publican y qué variables
lleva cada uno está en el README de su carpeta.
