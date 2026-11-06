# Backend (FastAPI)

API de Cinesfera: FastAPI + SQLAlchemy sobre PostgreSQL (Supabase), con los
datos de películas y series de TMDB.

## Cómo levantar el servidor

### Requisitos

| | Obligatorio | Notas |
| --- | --- | --- |
| [Python](https://www.python.org/downloads/) 3.10 o superior | Sí | En desarrollo se usa 3.14 |
| `backend/.env` con las credenciales | Sí | No está en el repo: pedíselo al equipo (ver [Variables de entorno](#variables-de-entorno)) |

### Primera vez

1. Parate en la carpeta `backend`:

   ```bash
   cd backend
   ```

2. Creá el entorno virtual:

   ```bash
   # macOS / Linux
   python3 -m venv .venv

   # Windows
   py -m venv .venv
   ```

   Crea la carpeta `.venv` con un Python solo para este proyecto. No se sube al
   repo: cada uno crea la suya.

3. Activá el entorno virtual:

   ```bash
   # macOS / Linux
   source .venv/bin/activate

   # Windows (PowerShell)
   .venv\Scripts\Activate.ps1

   # Windows (CMD)
   .venv\Scripts\activate.bat
   ```

   Cuando está activo vas a ver `(.venv)` al principio de la línea de la
   terminal. Desde acá, `python` y `pip` son los del entorno, en cualquier
   sistema.

   > Si PowerShell dice que la ejecución de scripts está deshabilitada, corré
   > una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y volvé a
   > activar.

4. Instalá las dependencias:

   ```bash
   python -m pip install -r requirements.txt
   ```

   Incluye FastAPI, `fastapi-cli` y `uvicorn`, que son los que levantan el
   servidor.

5. Creá el archivo de variables y completalo:

   ```bash
   cp .env.example .env        # Windows: copy .env.example .env
   ```

   Las que tenés que completar sí o sí son las de la base, el token de TMDB y
   `JWT_SECRET_KEY` (ver [Variables de entorno](#variables-de-entorno)). Si
   alguien del equipo ya te pasó su `.env`, copialo en `backend/` y salteá este
   paso.

6. Levantá el servidor:

   ```bash
   fastapi dev app/main.py
   ```

   Queda corriendo con recarga automática al guardar cambios:

   - API: http://localhost:8000
   - Documentación interactiva (Swagger): http://localhost:8000/docs
   - Documentación alternativa (ReDoc): http://localhost:8000/redoc

   Alternativa equivalente: `uvicorn app.main:app --reload`.

### Día a día

```bash
cd backend
source .venv/bin/activate      # Windows: .venv\Scripts\Activate.ps1
fastapi dev app/main.py
```

Volvé a correr `python -m pip install -r requirements.txt` solo si alguien
cambió `requirements.txt`.

### Problemas comunes

| Síntoma | Causa | Solución |
| --- | --- | --- |
| `command not found: fastapi` | El entorno virtual no está activado | Activalo (paso 3) |
| `ModuleNotFoundError` al arrancar | Faltan dependencias | `python -m pip install -r requirements.txt` |
| `Falta configurar JWT_SECRET_KEY` al hacer login | Falta la variable en `.env` | Completala (ver abajo) |
| El catálogo o las fichas responden `502` | Falta `TMDB_ACCESS_TOKEN` o TMDB no responde | Revisá el token en `.env` |
| El navegador bloquea las llamadas por CORS | El origen del frontend no está en `CORS_ORIGINS` | Agregalo, separado por coma |

## Variables de entorno

La configuración se lee de dos lugares, en este orden de prioridad:

1. **Variables de entorno del sistema** (es lo que inyecta Render en el deploy).
2. **El archivo `backend/.env`** (es lo que usás en tu máquina).

Por eso *no hay que tocar ninguna URL a mano al cambiar de entorno*: en local
manda `.env`, y en Render mandan las variables del servicio. Ningún `.env` se
versiona; en el repo solo están las plantillas `.env.example` (local) y
`.env.production.example` (referencia de qué cargar en Render).

| Variable | Obligatoria | Local | Deploy (Render) |
| --- | --- | --- | --- |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` | **Sí** | Datos de Supabase | Datos de Supabase |
| `DB_PORT` / `DB_NAME` | No | `5432` / `postgres` | Igual |
| `DB_SSLMODE` | No | `require` para Supabase; `disable` solo para un PostgreSQL local sin SSL | `require` |
| `DATABASE_URL` | No | Cadena de conexión completa; si está, gana sobre las `DB_*` | Igual |
| `TMDB_ACCESS_TOKEN` | **Sí** | Token de lectura de TMDB ("API Read Access Token") | Igual |
| `JWT_SECRET_KEY` | **Sí** | Cualquier texto largo y secreto | Uno distinto al local |
| `JWT_ALGORITHM` / `JWT_EXPIRE_MINUTES` | No | `HS256` / `30` | Igual |
| `ENVIRONMENT` | No | `local` | `production` |
| `API_URL` | No | `http://localhost:8000` | `https://cinesfera.onrender.com` |
| `CORS_ORIGINS` | No | `http://localhost:3000` (varios, separados por coma) | URL del frontend publicado |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | No | `false` / `lax` | `true` / `lax` |
| `TMDB_FORCE_IPV4` | No | `true` (ver [Conexión con TMDB](#conexión-con-tmdb)) | Igual |
| `ADMIN_INICIAL_EMAIL` / `ADMIN_INICIAL_PASSWORD` / `ADMIN_INICIAL_USUARIO` | No | Van las tres juntas o ninguna (ver [Administrador principal](#administrador-principal-y-moderación)) | Igual |
| `ADMIN_INICIAL_NOMBRE` / `ADMIN_INICIAL_APELLIDO` | No | `Administrador` / `Cinesfera` | Igual |
| `LIMITE_REPORTES_DIARIOS` | No | `20` | Igual |

## Tests

Desde `backend`, con el entorno virtual activado:

```bash
python -m unittest discover -s tests -v          # todos
python -m unittest tests.test_registro -v        # un archivo
```

No necesitan el servidor levantado ni el `.env`, y no se conectan a Supabase:
cada test arma una base SQLite en memoria con usuarios inventados. Para saber
cómo funcionan y cómo agregar uno nuevo, leé [`tests/README.md`](tests/README.md).

Los tests end-to-end (navegador + frontend + este backend) se corren desde
`frontend` con `pnpm test:e2e`; ver [`frontend/README.md`](../frontend/README.md).

## Base de datos y migraciones

Las tablas viven en Supabase. Los cambios de esquema están en `migrations/`, y
cada archivo se aplica **una sola vez**, en orden, sobre una base existente
(desde el editor SQL de Supabase, por ejemplo).

| Migración | Qué hace |
| --- | --- |
| `001_agregar_resena_padre.sql` | Agrega `resena_padre_id` para poder responder reseñas |
| `002_reemplazar_amistades_por_seguimientos.sql` | Crea `seguimientos`; convierte cada amistad aceptada en dos seguimientos y descarta las solicitudes pendientes o rechazadas |
| `003_agregar_datos_perfil.sql` | Agrega biografía, ubicación y géneros favoritos a `usuarios` |
| `004_calificaciones_comunidad.sql` | Crea `calificaciones_resenas` (estrellas de la comunidad) y permite comentarios sin calificación |
| `005_administracion_moderacion.sql` | Reportes, auditoría y administrador principal |
| `006_auditoria_suspensiones.sql` | Guarda inicio y fin de cada suspensión en la auditoría |
| `007_propagar_eliminacion_resenas.sql` | Repara reseñas eliminadas antes de que la eliminación se propagara a sus respuestas |
| `008_agregar_reputacion_usuario.sql` | Agrega `usuarios.reputacion` y calcula los valores iniciales |
| `009_agregar_fotos_perfil.sql` | Crea `fotos_perfil`, donde se guardan las imágenes de perfil |

## API

La lista completa de endpoints, con sus cuerpos y respuestas, está en
http://localhost:8000/docs con el servidor levantado. Acá está lo que no se ve
ahí: reglas de negocio y cómo probar a mano.

### Autenticación

| Endpoint | Qué hace |
| --- | --- |
| `POST /auth/register` | Crea una cuenta. Email y nombre de usuario son únicos (`409` si se repiten) |
| `POST /auth/login` | Valida las credenciales y deja la sesión en la cookie `access_token` |
| `GET /auth/me` | Devuelve el usuario de la sesión |
| `POST /auth/logout` | Borra la cookie de sesión |
| `GET /auth/csrf` | Devuelve el token CSRF de la sesión actual |

El login recibe dos campos de texto:

- `identificador`: email o nombre de usuario. Se le quitan los espacios
  externos y se pasa a minúsculas. Si contiene `@` se busca por email; si no,
  por nombre de usuario.
- `password`: la contraseña exacta, respetando mayúsculas y espacios.

Responde `{"mensaje": ..., "csrf_token": ..., "rol": ...}`. Las peticiones que
modifican datos con la sesión de la cookie tienen que mandar ese `csrf_token`
en el encabezado `X-CSRF-Token`. La API también acepta el token de sesión como
`Authorization: Bearer <token>`; en ese caso no hace falta el CSRF.

Una cuenta suspendida o eliminada no puede iniciar sesión ni seguir usando una
sesión ya abierta.

#### Probar a mano en Postman

Con el servidor levantado, elegí `POST`, `Body > raw > JSON` y `No Auth`.
Postman guarda solo la cookie del login, así que las peticiones siguientes a
`localhost:8000` ya van con la sesión.

1. **Registrar una cuenta de prueba** (se crea en la base configurada en tu
   `.env`). Podés saltearlo si ya tenés una cuenta.

   ```http
   POST http://localhost:8000/auth/register

   {
     "nombre": "Persona",
     "apellido": "Prueba",
     "nombre_usuario": "persona.prueba",
     "email": "persona.prueba@example.com",
     "password": "ClaveSegura123"
   }
   ```

   Esperado: `201 Created` con los datos del usuario. Si el email o el nombre de
   usuario ya existen: `409 Conflict`.

2. **Login por email**: `{"identificador": "persona.prueba@example.com", "password": "ClaveSegura123"}`
   a `POST /auth/login`. Esperado: `200 OK` con `mensaje`, `csrf_token` y `rol`.
   Después, `GET /auth/me` devuelve `id`, `nombre`, `apellido`,
   `nombre_usuario`, `email`, `foto_url`, `rol`, `estado` y `fecha_registro`
   (nunca la contraseña ni su hash).

3. **Login por nombre de usuario**: igual, con `"identificador": "persona.prueba"`.
   También tiene que funcionar con `" PERSONA.PRUEBA "`.

4. **Contraseña incorrecta**: `401 Unauthorized` con
   `{"detail": "Credenciales inválidas"}`, tanto por email como por nombre de
   usuario.

5. **Cuenta inexistente** (`cuenta.inexistente@example.com` o
   `cuenta.inexistente`): el mismo `401` con `Credenciales inválidas`.

Si falta `identificador` o `password`, o alguno no es texto, responde
`422 Unprocessable Entity`.

### Perfil de usuario

Trabajan con el UUID que devuelven el registro o `GET /auth/me`.

| Endpoint | Qué hace |
| --- | --- |
| `GET /usuarios/{usuario_id}/perfil` | Datos públicos del usuario |
| `PATCH /usuarios/{usuario_id}/perfil` | Modifica solo los campos enviados de la propia cuenta |
| `PATCH /usuarios/{usuario_id}/password` | Cambia la contraseña de la propia cuenta |
| `PUT /usuarios/{usuario_id}/foto-perfil` | Reemplaza la foto (multipart, campo `archivo`) |
| `DELETE /usuarios/{usuario_id}/foto-perfil` | Quita la foto |
| `GET /usuarios/{usuario_id}/foto-perfil` | Sirve la imagen, sin sesión |

Todos los que modifican requieren la sesión del dueño y el encabezado CSRF.

**Modificar el perfil.** Acepta `nombre`, `apellido`, `nombre_usuario`,
`email`, `bio`, `ubicacion` y `generos_favoritos` (hasta cinco distintos, de la
lista oficial de `GET /contenidos/generos`). Email y nombre de usuario siguen
siendo únicos. Para quitar la biografía o la ubicación se envía el campo con
`null`. `foto_url` se sigue aceptando por compatibilidad con clientes
anteriores, pero la interfaz usa los endpoints de foto.

| Respuesta | Cuándo |
| --- | --- |
| `200 OK` | Devuelve el perfil actualizado |
| `401 Unauthorized` | No hay sesión, expiró o el usuario ya no existe |
| `403 Forbidden` | El UUID corresponde a otro perfil |
| `409 Conflict` | El email o el nombre de usuario ya pertenecen a otra cuenta |
| `422 Unprocessable Entity` | El cuerpo está vacío o algún dato no es válido |

Para probarlo en Postman: hacé login, copiá el `csrf_token`, sacá tu UUID con
`GET /auth/me` y mandá el `PATCH` con el encabezado `X-CSRF-Token`:

```http
PATCH http://localhost:8000/usuarios/UUID-DEL-USUARIO/perfil
Content-Type: application/json
X-CSRF-Token: CSRF-TOKEN-DEL-LOGIN

{
  "nombre": "Persona",
  "apellido": "Actualizada",
  "nombre_usuario": "persona.actualizada",
  "bio": "Fan del cine independiente",
  "ubicacion": "Montevideo, Uruguay",
  "generos_favoritos": ["Drama", "Comedia"]
}
```

Después, `GET /auth/me` tiene que mostrar los cambios.

**Contraseña.** Requiere `password_actual` y `password_nueva`. La nueva debe
tener entre 8 y 128 caracteres y ser distinta de la actual. Una contraseña
actual incorrecta responde `400`; intentar cambiar la de otra cuenta, `403`.

**Foto.** Admite JPEG, PNG o WebP de hasta 5 MB. El binario se guarda en
PostgreSQL y `foto_url` se actualiza con una URL versionada, para que el
navegador no muestre una versión vieja. La tabla tiene Row Level Security sin
políticas para clientes de Supabase: las imágenes solo se acceden por estos
endpoints.

### Perfil público con reseñas

`GET /usuarios/{usuario_id}/perfil-publico`, o por nombre de usuario con
`GET /usuarios/por-nombre/{nombre_usuario}/perfil-publico` (no distingue
mayúsculas y exige el nombre completo). No requiere sesión. Un usuario
inexistente responde `404` con `{"detail": "Usuario no encontrado"}`.

Devuelve nombre, apellido, nombre de usuario, foto, biografía, ubicación,
géneros favoritos, rol, fecha de registro, reputación, cantidad de seguidores y
de seguidos, y las reseñas. Nunca el email ni la contraseña.

- Solo incluye las reseñas originales del usuario, no sus comentarios ni
  respuestas, ordenadas por `fecha` descendente (y por `id` descendente si
  coinciden).
- Cada reseña trae `id`, `contenido_tmdb_id`, `contenido_tipo`,
  `contenido_titulo`, `plataforma_id`, `calificacion`, `texto` y `fecha`. El
  frontend usa el tipo y el ID de TMDB para mostrar título, año y póster;
  `contenido_titulo` queda de respaldo si TMDB no responde.
- El perfil de una cuenta suspendida o eliminada deja de ser público.

### Seguimientos y amigos

Seguir es unidireccional y no requiere aceptación. Cuando dos personas se siguen
mutuamente son amigas; la amistad se calcula a partir de esos dos seguimientos y
no se guarda aparte.

| Endpoint | Qué hace |
| --- | --- |
| `POST /usuarios/{usuario_id}/seguir` | Sigue al usuario (`201`) |
| `DELETE /usuarios/{usuario_id}/seguir` | Deja de seguirlo (`204`) |
| `GET /usuarios/{usuario_id}/seguimiento` | `siguiendo`, `te_sigue` y `son_amigos` respecto de la sesión |
| `GET /usuarios/{usuario_id}/seguidores` | Quiénes lo siguen |
| `GET /usuarios/{usuario_id}/seguidos` | A quiénes sigue |
| `GET /usuarios/{usuario_id}/amigos` | Solo los mutuos; requiere sesión y solo para la propia cuenta |

Seguirse a uno mismo responde `400`, repetir un seguimiento `409` y dejar de
seguir una relación inexistente `404`. Los cambios requieren sesión y CSRF.
Dejar de seguir rompe la amistad, pero conserva el seguimiento que exista en la
otra dirección.

### Películas, series y reseñas

| Endpoint | Qué hace |
| --- | --- |
| `GET /contenidos/generos` | Géneros oficiales de películas y series de TMDB, combinados. Se guardan en memoria mientras el proceso vive |
| `GET /contenidos/{tipo}/{tmdb_id}` | Ficha desde TMDB. `tipo` es `pelicula` o `serie` |
| `GET /contenidos/{tipo}/{tmdb_id}/resenas` | Reseñas locales con autor, valoraciones y promedio comunitario |
| `POST /contenidos/{tipo}/{tmdb_id}/resenas` | Publica una reseña, un comentario o una respuesta |
| `GET /contenidos/{tipo}/{tmdb_id}/valoraciones/mias` | Estrellas vigentes de la sesión en ese contenido (`resena_id` y `calificacion`) |
| `PATCH /contenidos/{tipo}/{tmdb_id}/resenas/{resena_id}/valoracion` | Edita una valoración propia |

```http
GET http://localhost:8000/contenidos/pelicula/550
GET http://localhost:8000/contenidos/pelicula/550/resenas
GET http://localhost:8000/contenidos/serie/1399
```

**Ficha.** Necesita `TMDB_ACCESS_TOKEN`. Un ID inexistente responde `404`; si
TMDB no está configurado o no responde, `502`. El listado de reseñas sigue
funcionando aunque TMDB falle.

**Listado de reseñas.** Ordenadas por `fecha` descendente (y por `id`
descendente si coinciden); sin reseñas devuelve `[]`. Cada una incluye
`promedio_comunitario` y `cantidad_valoraciones`: por ejemplo, puntuaciones de
3 y 5 dan `4.0` y `2`, y sin puntuaciones `null` y `0`. El promedio usa solo las
estrellas vigentes de `calificaciones_resenas`; los comentarios sin estrellas y
los votos positivos/negativos (`valoraciones_resena`, una tabla independiente)
no participan.

**Publicar.** Requiere sesión y, con cookie, `X-CSRF-Token`. El `usuario_id`
del cuerpo tiene que ser el de la sesión: nunca se publica en nombre de otro.

```json
{
  "usuario_id": "d25f6b52-b42a-4a22-98a5-92559be9815b",
  "texto": "Una película inolvidable",
  "calificacion": 4.5,
  "plataforma_id": 2,
  "resena_padre_id": null
}
```

- **Sin `resena_padre_id`**: es una reseña original y la calificación es
  obligatoria. Antes de guardar se comprueba que el contenido exista en TMDB
  (si ya está en la base local, no se consulta).
- **Con el ID de una reseña original**: es un comentario y admite una valoración
  de 0.5 a 5 en pasos de 0.5. Comentario y valoración se guardan en una sola
  transacción; valorar dos veces la misma reseña responde `409` sin guardar el
  comentario. Para comentar sin valorar, omití `calificacion` o mandá `null`.
- Se pueden responder comentarios, pero sin estrellas. Valorar una respuesta o
  la reseña propia responde `422`.
- La reseña padre tiene que existir y ser del mismo contenido. La respuesta
  exitosa es `201`.

**Editar una valoración.** Recibe solo `{"calificacion": 4.5}` (0.5 a 5, en
pasos de 0.5); la identidad sale de la sesión. Modifica la fila existente y
devuelve la puntuación, el promedio comunitario y la cantidad de valoraciones;
el comentario, su fecha y la calificación original de la película no cambian.
Sin sesión `401`, sin valoración propia `403`, reseña de otro contenido `404`,
datos inválidos `422`. El frontend precarga las estrellas, permite cancelar o
reintentar, y muestra el promedio que confirma el backend.

**Eliminar.** Eliminar una reseña marca como eliminados también todos sus
comentarios y respuestas, y quita sus calificaciones, en la misma transacción.

**Reputación.** `usuarios.reputacion` es el promedio de todas las estrellas
(0.5 a 5) que recibieron las reseñas originales del usuario, con hasta dos
decimales, y vale `0` si no tiene. Se recalcula en la misma transacción al
crear, editar o eliminar una calificación. Las reseñas ocultas cuentan; las
eliminadas y los votos positivos/negativos, no.

### Administración y moderación

Las acciones de moderación requieren una sesión con rol `admin` y, con cookie,
el encabezado `X-CSRF-Token`. Una cuenta sin rol de administrador recibe `403`.

| Endpoint | Qué hace |
| --- | --- |
| `PATCH /usuarios/{usuario_id}/suspender` | Pasa la cuenta a `suspendido` |
| `DELETE /usuarios/{usuario_id}` | Eliminación lógica: pasa la cuenta a `eliminado` y conserva sus datos |
| `POST /admin/administradores` | Da el rol de administrador (solo el principal) |
| `DELETE /admin/administradores/{usuario_id}` | Quita el rol de administrador (solo el principal) |
| `POST /reportes` | Un usuario reporta un comentario o a otro usuario |

Suspender y eliminar devuelven el usuario actualizado con `200`. Suspender una
cuenta eliminada responde `409`; un UUID inexistente, `404`.

#### Administrador principal y moderación

Si están configuradas `ADMIN_INICIAL_EMAIL`, `ADMIN_INICIAL_PASSWORD` (12
caracteres o más) y `ADMIN_INICIAL_USUARIO`, y todavía no hay ningún
administrador, al arrancar se crea uno con `es_admin_principal=true` (requiere
la migración 005). La contraseña se guarda con el mismo hash que las demás
cuentas, nunca en texto plano. Si ya existe un administrador no crea otro ni
cambia sus credenciales. El principal no puede quitarse su propio rol,
suspenderse ni eliminarse.

**Reportes.** El motivo es de una lista cerrada y la descripción es opcional.
No se puede reportar a uno mismo, un comentario propio, ni repetir el reporte
sobre el mismo objetivo. `LIMITE_REPORTES_DIARIOS` limita el abuso. Reportar
no cambia el contenido reportado.

**Panel `/admin`.** Permite filtrar y paginar reportes, ver el snapshot
original, administrar usuarios y consultar la auditoría. Ocultar, restaurar o
eliminar comentarios y suspender, reactivar o eliminar usuarios son siempre
acciones explícitas. Las suspensiones pueden ser permanentes o con vencimiento;
`ocultar_contenido` decide si se ocultan las reseñas anteriores.

Cada acción guarda administrador, fecha, motivo, estado anterior y nuevo, y nota
interna en `auditoria_moderacion`, que no se puede modificar ni borrar. Cuando
una acción resuelve el objetivo, se cierran todos sus reportes abiertos. Los
administradores pueden navegar y buscar en el catálogo, pero no publicar
reseñas, respuestas ni reportes.

### Conexión con TMDB

El catálogo, las búsquedas y las fichas comparten un cliente HTTP persistente.
Por defecto las conexiones salen por IPv4 (`TMDB_FORCE_IPV4=true`); para usar
IPv4 e IPv6 indistintamente, poné `false` y reiniciá el backend.

Solo se reintentan las lecturas: hasta tres intentos ante cortes, timeouts y
respuestas 429/500/502/503/504. Las lecturas exitosas se guardan 60 segundos
(hasta 128 combinaciones de ruta y filtros) y, ante un fallo transitorio, se
puede usar esa misma lectura hasta cinco minutos. Los errores de autenticación y
los contenidos inexistentes no usan ese respaldo. Las escrituras nunca se
reintentan.

## Deploy en Render

El backend está publicado en **https://cinesfera.onrender.com**. El servicio ya
está creado y conectado al repo: **cada push a `main` dispara un deploy**.
`render.yaml` (en la raíz del repo) deja la configuración escrita, para poder
recrear el servicio si hiciera falta.

| | |
| --- | --- |
| Servicio | `cinesfera` (web, plan free) |
| Raíz | `backend/` |
| Build | `pip install -r requirements.txt` |
| Start | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check | `/health` (configurarlo en Settings → Health Check Path) |

### Variables a cargar en Render

En **Render → cinesfera → Environment**:

| Variable | Valor |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `API_URL` | `https://cinesfera.onrender.com` |
| `CORS_ORIGINS` | `https://cinesfera-three.vercel.app` |
| `TMDB_ACCESS_TOKEN` | Token de lectura de la cuenta de TMDB |
| `JWT_SECRET_KEY` | Texto largo y secreto, distinto del que se usa en local |

Las de la base (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) ya
están cargadas y **nunca** se escriben en el repo. Del lado del frontend, la
contraparte es `NEXT_PUBLIC_API_URL=https://cinesfera.onrender.com` en Vercel
(ver `frontend/README.md`).

### Verificar el deploy

```bash
curl https://cinesfera.onrender.com/health
# {"status":"ok"}
```

Para confirmar CORS, el preflight desde el origen del frontend tiene que
devolver el header `access-control-allow-origin`:

```bash
curl -i -X OPTIONS https://cinesfera.onrender.com/auth/login \
  -H "Origin: https://cinesfera-three.vercel.app" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control-allow-origin
```

> Los *preview deployments* de Vercel usan otras URLs
> (`cinesfera-three-git-<rama>-....vercel.app`) que **no** están en
> `CORS_ORIGINS`, así que no pueden llamar a la API. Para probar una preview
> contra el backend real, agregá su URL a la lista (separada por coma).

> **Plan free:** el servicio se duerme tras ~15 minutos sin tráfico, así que la
> primera request después de un rato puede tardar ~50 segundos. Es esperable.

## Estructura del proyecto

```
backend/
├── app/
│   ├── main.py             # App FastAPI: CORS, routers y /health
│   ├── database.py         # Motor y sesión de SQLAlchemy
│   ├── core/
│   │   └── config.py       # Settings: lee .env y variables de entorno
│   ├── models/             # Tablas (SQLAlchemy)
│   ├── schemas/            # Cuerpos y respuestas (Pydantic)
│   ├── services/           # Lógica de negocio
│   ├── routers/            # Endpoints HTTP
│   └── catalogue_service/  # Catálogo, búsqueda y landing (TMDB)
├── migrations/             # Cambios de esquema, en orden
├── tests/                  # Tests con unittest (ver tests/README.md)
├── requirements.txt        # Dependencias del proyecto
├── .env.example            # Plantilla del entorno local
├── .env.production.example # Referencia de qué cargar en Render
├── .env                    # Tu config local (NO se versiona)
└── .venv/                  # Entorno virtual local (NO se versiona)
```

## Agregar una dependencia

1. Con el entorno virtual activado, instalá el paquete:

   ```bash
   python -m pip install <paquete>
   ```

2. Agregalo a `requirements.txt` (a mano, o regenerándolo con
   `python -m pip freeze > requirements.txt`) y avisá al equipo para que corran
   `python -m pip install -r requirements.txt`.
