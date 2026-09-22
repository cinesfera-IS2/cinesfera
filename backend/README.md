# Backend (FastAPI)

## Requisitos

- Python 3.10 o superior (en desarrollo se usa Python 3.14)
- `pip`

## Puesta en marcha (primera vez)

1. Parate en la carpeta `backend`:

   ```bash
   cd backend
   ```

2. Creá un entorno virtual (solo la primera vez):

   ```bash
   python3 -m venv .venv
   ```

3. Activá el entorno virtual:

   ```bash
   # macOS / Linux
   source .venv/bin/activate

   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1
   ```

   Vas a ver `(.venv)` al principio de la línea de tu terminal cuando esté activo. El `.venv` no se sube al repo (está en `.gitignore`), así que cada persona del equipo crea el suyo localmente.

4. Instalá las dependencias del proyecto:

   ```bash
   pip install -r requirements.txt
   ```

   Esto instala FastAPI junto con `fastapi-cli` y `uvicorn`, que son los que permiten levantar el servidor.

## Variables de entorno

La configuración vive en `app/core/config.py` y se lee de dos lugares, en este
orden de prioridad:

1. **Variables de entorno del sistema** (es lo que inyecta Render en el deploy).
2. **El archivo `backend/.env`** (es lo que usás en tu máquina).

Por eso *no hay que tocar ninguna URL a mano al cambiar de entorno*: en local
manda `.env`, y en Render mandan las variables del servicio.

Ningún archivo `.env` se versiona. Lo único que está en el repo son las
plantillas `.env.example` y `.env.production.example`, sin valores reales.

| Variable | Local | Deploy (Render) |
| --- | --- | --- |
| `ENVIRONMENT` | `local` | `production` |
| `API_URL` | `http://localhost:8000` | `https://cinesfera.onrender.com` |
| `CORS_ORIGINS` | `http://localhost:3000` | URL del frontend publicado |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Supabase | Supabase |
| `DATABASE_URL` | *(opcional)* | *(opcional)* |

`CORS_ORIGINS` acepta varios orígenes separados por coma. `DATABASE_URL`, si
está definida, gana sobre las piezas `DB_*`; sirve para pegar directo la cadena
de conexión que da Supabase.

### Primera vez

```bash
cp .env.example .env
```

Después completá los datos de la base. El `.env` **no se versiona**.
`.env.production.example` es solo la referencia de qué cargar en Render.

## Levantar el servidor

Con el entorno virtual activado:

```bash
fastapi dev app/main.py
```

Esto levanta el servidor en modo desarrollo (con recarga automática al guardar cambios) en:

- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs
- Documentación alternativa (ReDoc): http://localhost:8000/redoc

Alternativa equivalente usando `uvicorn` directamente:

```bash
uvicorn app.main:app --reload
```

## Resumen rápido (para el día a día, una vez configurado)

```bash
cd backend
source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
fastapi dev app/main.py
```

## Inicio de sesión

`POST /auth/login` valida las credenciales y devuelve `access_token` y
`token_type: "bearer"`. Configurá `JWT_SECRET_KEY` en el entorno del backend.
Enviá el token como `Authorization: Bearer <access_token>` para consultar
`GET /auth/me` o actualizar el perfil.

El cuerpo JSON requiere dos campos de texto:

- `identificador`: email o nombre de usuario registrado. Se eliminan los espacios
  externos y se convierte a minúsculas. Si contiene `@`, se busca por email;
  en caso contrario, por nombre de usuario.
- `password`: contraseña exacta, respetando mayúsculas y espacios.

### Pruebas manuales en Postman

Iniciá el servidor y verificá que `backend/.env` tenga la configuración de la
base de datos indicada en `.env.example`. La base debe tener la tabla de usuarios
disponible; estas pruebas usan la base configurada.

Para cada solicitud elegí el método `POST`, ingresá la URL completa y seleccioná
`Body > raw > JSON`. Usá `Content-Type: application/json` y `No Auth`.
Copiá únicamente el objeto JSON en el cuerpo de Postman.

#### 1. Registrar una cuenta de prueba

Esta solicitud crea un usuario en la base configurada. Podés omitirla si ya tenés
una cuenta y reemplazar los datos de los ejemplos por sus credenciales.

```http
POST http://localhost:8000/auth/register
Content-Type: application/json

{
  "nombre": "Persona",
  "apellido": "Prueba",
  "nombre_usuario": "persona.prueba",
  "email": "persona.prueba@example.com",
  "password": "ClaveSegura123"
}
```

Esperado: `201 Created` con los datos del usuario. Si el email o nombre de usuario
ya está registrado, responde `409 Conflict`; usá una cuenta cuyas credenciales
conozcas o registrá otra con ambos identificadores diferentes.

#### 2. Inicio correcto por email

```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "identificador": "persona.prueba@example.com",
  "password": "ClaveSegura123"
}
```

Esperado: `200 OK` con `access_token` y `token_type: "bearer"`.
Usá ese token en `GET /auth/me` para obtener `id`, `nombre`, `apellido`,
`nombre_usuario`, `email`, `foto_url`, `rol`, `estado` y `fecha_registro`.
No incluye contraseña ni hash.

#### 3. Inicio correcto por nombre de usuario

```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "identificador": "persona.prueba",
  "password": "ClaveSegura123"
}
```

Esperado: `200 OK` con un token para la misma cuenta del caso anterior.
También podés probar `" PERSONA.PRUEBA "` como identificador: debe funcionar.

#### 4. Contraseña incorrecta

```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "identificador": "persona.prueba@example.com",
  "password": "OtraClaveIncorrecta"
}
```

Esperado: `401 Unauthorized` con el siguiente cuerpo. Repetí la prueba usando
`persona.prueba` como identificador; debe devolver el mismo error.

```json
{
  "detail": "Credenciales inválidas"
}
```

#### 5. Email o nombre de usuario inexistente

Elegí identificadores que no estén registrados en tu base.

```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "identificador": "cuenta.inexistente@example.com",
  "password": "ClaveSegura123"
}
```

Esperado: `401 Unauthorized` con `{"detail": "Credenciales inválidas"}`.
Repetí con `cuenta.inexistente` para verificar un nombre de usuario inexistente.

Si falta `identificador` o `password`, o alguno no es texto, la validación del
cuerpo responde `422 Unprocessable Entity`.

## Pruebas automatizadas

Desde `backend`, con el entorno virtual activado:

```bash
python -m unittest discover -s tests -v
```

Las pruebas usan `unittest`, hashes reales y pruebas unitarias con consultas
simuladas. Las pruebas HTTP de perfil usan `TestClient` y SQLite en memoria,
con el login, emisión y validación de JWT y servicios reales. Verifican
persistencia de datos y foto, eliminación de foto, duplicados, validación y
rechazo de tokens inválidos, expirados o de usuarios inexistentes, además del
bloqueo de cambios en perfiles ajenos. No conectan a Supabase ni al despliegue.

## Perfil de usuario

## Solicitudes de amistad

Los tres endpoints requieren `Authorization: Bearer <access_token>` obtenido en
`POST /auth/login`. En `amistades`, `usuario_id_1` es quien envía la solicitud y
`usuario_id_2` quien la recibe.

- `POST /amistades/solicitudes` con `{"destinatario_id":"UUID"}` crea una solicitud
  `pendiente` y responde `201`. No permite enviarla a la propia cuenta (`400`),
  a una cuenta inexistente (`404`) ni crear otra relación entre el mismo par de
  usuarios en cualquier dirección (`409`).
- `POST /amistades/solicitudes/{remitente_id}/aceptar` permite al destinatario
  pasar una solicitud pendiente a `aceptada`.
- `POST /amistades/solicitudes/{remitente_id}/rechazar` permite al destinatario
  pasar una solicitud pendiente a `rechazada`.

Las respuestas incluyen ambos UUID, `estado`, `fecha_solicitud` y
`fecha_respuesta`. Las solicitudes inexistentes o dirigidas a otra cuenta
responden `404`; una solicitud ya respondida responde `409`.

Para probarlo en Postman, iniciá sesión con la cuenta A y enviá una solicitud
con el UUID de B. Iniciá sesión con B y llamá a `/amistades/solicitudes/UUID-DE-A/aceptar`
o `/rechazar`. Repetir la respuesta debe devolver `409`.

### Perfil público con reseñas

`GET /usuarios/{usuario_id}/perfil-publico` devuelve el nombre, apellido,
nombre de usuario, foto, reputación y reseñas de cualquier usuario existente.
También se puede consultar por nombre de usuario con
`GET /usuarios/por-nombre/{nombre_usuario}/perfil-publico` (por ejemplo,
`/usuarios/por-nombre/ana/perfil-publico`). La búsqueda ignora mayúsculas y
minúsculas y exige el nombre completo; si no existe, responde `404`.
No requiere token. Las reseñas se ordenan por `fecha` descendente; ante fechas
iguales, por `id` descendente. Cada reseña incluye `id`, `contenido_tmdb_id`,
`plataforma_id`, `calificacion`, `texto` y `fecha`. La reputación es la suma de
`valoraciones_resena.valor` recibidas por todas las reseñas del usuario; si no
tiene valoraciones, es `0`. No se devuelve el email ni la contraseña.

Para probarlo vos misma en Postman:

1. Conseguí el UUID de otra cuenta desde una respuesta de registro o desde la
   tabla `usuarios` de Supabase.
2. Creá una petición `GET` a
   `http://localhost:8000/usuarios/UUID-DE-OTRA-CUENTA/perfil-publico`, con
   `Authorization > No Auth` y sin body.
3. Esperá `200 OK`. Verificá `nombre`, `foto_url`, `reputacion` y que las fechas
   del arreglo `resenas` vayan de la más nueva a la más vieja. Si la cuenta no
   tiene reseñas, `resenas` será `[]` y `reputacion` será `0`.
4. Repetí con un UUID inexistente: debe responder `404 Not Found` con
   `{"detail":"Usuario no encontrado"}`.

La respuesta utiliza IDs de TMDB porque el esquema de la base no guarda el
título ni el póster del contenido en `resenas`.

Los endpoints de perfil trabajan con el UUID que devuelve el registro o
`GET /auth/me`:

- `GET /usuarios/{usuario_id}/perfil`: obtiene los datos públicos del usuario.
- `PATCH /usuarios/{usuario_id}/perfil`: requiere el token Bearer del login y
  modifica solamente los campos enviados del usuario autenticado. El UUID de
  la ruta debe coincidir con el usuario del token.

El `PATCH` acepta `nombre`, `apellido`, `nombre_usuario`, `email` y `foto_url`.
El email y el nombre de usuario siguen siendo únicos. `foto_url` debe ser una
URL HTTP/HTTPS pública, normalmente la obtenida después de subir la imagen a
Supabase Storage. Para quitar la foto actual se envía `"foto_url": null`.

Para probar el flujo en Postman:

1. Ejecutá `POST /auth/login` y copiá `access_token`.
2. Seleccioná `Authorization > Bearer Token`, pegá el token y ejecutá
   `GET /auth/me` para obtener el UUID de tu cuenta.
3. Ejecutá el siguiente `PATCH` con ese UUID y el mismo Bearer Token.
4. Consultá nuevamente `GET /auth/me` para verificar los cambios.

Ejemplo:

```http
PATCH http://localhost:8000/usuarios/UUID-DEL-USUARIO/perfil
Content-Type: application/json
Authorization: Bearer TOKEN-DEL-LOGIN

{
  "nombre": "Persona",
  "apellido": "Actualizada",
  "nombre_usuario": "persona.actualizada",
  "foto_url": "https://ejemplo.com/fotos/perfil.jpg"
}
```

Respuestas relevantes:

- `200 OK`: devuelve el perfil actualizado.
- `401 Unauthorized`: falta el token, es inválido o expiró, o su usuario ya no existe.
- `403 Forbidden`: el UUID solicitado corresponde a otro perfil.
- `409 Conflict`: el email o el nombre de usuario ya pertenece a otra cuenta.
- `422 Unprocessable Entity`: el cuerpo está vacío o algún dato no es válido.

El cambio de foto guarda la URL de una imagen ya subida. Este endpoint no
recibe archivos ni realiza la subida a Storage.

## Deploy en Render

El backend está publicado en **https://cinesfera.onrender.com**.

| | |
| --- | --- |
| Servicio | `cinesfera` (web, plan free) |
| Raíz | `backend/` |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` |
| URL | `https://cinesfera.onrender.com` |

El servicio ya está creado y conectado al repo, así que los deploys salen solos
con cada push. `render.yaml` (en la raíz del repo) deja esa configuración
escrita, para tenerla versionada y poder recrear el servicio si hiciera falta.

### Variables a cargar en Render

En **Render → cinesfera → Environment**, estas tres hay que agregarlas a mano:

| Variable | Valor |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `API_URL` | `https://cinesfera.onrender.com` |
| `CORS_ORIGINS` | `https://cinesfera-three.vercel.app` |

Las de la base (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) ya
están cargadas. **Nunca** se escriben en el repo.

Del lado del frontend, la contraparte es una sola variable en Vercel:
`NEXT_PUBLIC_API_URL=https://cinesfera.onrender.com` (ver `frontend/README.md`).

Además, en **Settings** conviene dejar el *Health Check Path* en `/health`, así
Render sabe cuándo el servicio quedó arriba.

### Verificar el deploy

```bash
curl https://cinesfera.onrender.com/health
# {"status":"ok"}
```

La documentación queda en `https://cinesfera.onrender.com/docs`.

Para confirmar que CORS quedó bien, el preflight desde el origen del frontend
tiene que devolver el header `access-control-allow-origin`:

```bash
curl -i -X OPTIONS https://cinesfera.onrender.com/auth/login \
  -H "Origin: https://cinesfera-three.vercel.app" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```

> Los *preview deployments* de Vercel usan URLs distintas
> (`cinesfera-three-git-<rama>-....vercel.app`) y **no** están en `CORS_ORIGINS`,
> así que no van a poder llamar a la API. Si necesitan probar contra el backend
> real desde una preview, agregá esa URL a la lista (separada por coma).

### Redeploys

Cada push a `main` dispara un deploy automático. No hace falta hacer nada más.

> **Nota sobre el plan free:** el servicio se duerme tras ~15 minutos sin
> tráfico, así que la primera request después de un rato puede tardar ~50
> segundos en responder. Es esperable, no es un error.

## Estructura del proyecto

```
cinesfera/
├── render.yaml                 # Blueprint del deploy en Render
└── backend/
    ├── app/
    │   ├── main.py             # App FastAPI: CORS, routers y /health
    │   ├── database.py         # Motor y sesión de SQLAlchemy
    │   ├── core/
    │   │   └── config.py       # Settings: lee .env y variables de entorno
    │   ├── models/             # Tablas (SQLAlchemy)
    │   ├── schemas/            # Cuerpos y respuestas (Pydantic)
    │   ├── services/           # Lógica de negocio
    │   └── routers/            # Endpoints HTTP
    ├── requirements.txt        # Dependencias del proyecto
    ├── .env                    # Config local (NO se versiona)
    ├── .env.example            # Plantilla del entorno local
    ├── .env.production.example # Referencia de qué cargar en Render
    └── .venv/                  # Entorno virtual local (no se versiona)
```

## Agregar una nueva dependencia

1. Con el entorno virtual activado, instalá el paquete:

   ```bash
   pip install <paquete>
   ```

2. Agregalo a `requirements.txt` (a mano, o regenerando el archivo con `pip freeze > requirements.txt`) y avisá al equipo para que actualicen su entorno con `pip install -r requirements.txt`.
