# Backend (FastAPI)

## Valoración comunitaria de reseñas (Scrum 123)

`GET /contenidos/{tipo}/{tmdb_id}/resenas` incluye `promedio_comunitario`
y `cantidad_valoraciones` en cada reseña. Por ejemplo, dos puntuaciones de
3 y 5 devuelven `4.0` y `2`. Sin puntuaciones devuelve `null` y `0`.
El cálculo usa las puntuaciones vigentes de `calificaciones_resenas`, agrupadas
por reseña, y refleja las altas y ediciones en la siguiente consulta. Los
comentarios sin estrellas y los votos positivos/negativos (`valoracion`) no
participan en este promedio. Requiere la migración `004_calificaciones_comunidad.sql`.

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
| `TMDB_ACCESS_TOKEN` | Token de lectura de TMDB | Token de lectura de TMDB |

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

Las pruebas no conectan a Supabase ni al despliegue: cada una arma una base
SQLite en memoria con usuarios inventados. Cubren registro, inicio de sesión,
modificación de perfil y perfil público. Para saber cómo funcionan y cómo
agregar una nueva, leé [`tests/README.md`](tests/README.md).

## Perfil de usuario

## Seguimientos y amigos

Los seguimientos son unidireccionales y no requieren aceptación. Cuando dos
personas se siguen mutuamente se consideran amigas; la amistad se calcula desde
esos dos seguimientos y no se guarda por separado.

- `POST /usuarios/{usuario_id}/seguir` sigue al usuario y responde `201`.
- `DELETE /usuarios/{usuario_id}/seguir` deja de seguirlo y responde `204`.
- `GET /usuarios/{usuario_id}/seguimiento` indica `siguiendo`, `te_sigue` y
  `son_amigos` respecto de la sesión actual.
- `GET /usuarios/{usuario_id}/seguidores` lista quiénes siguen al usuario.
- `GET /usuarios/{usuario_id}/seguidos` lista a quiénes sigue.
- `GET /usuarios/{usuario_id}/amigos` lista únicamente los seguimientos mutuos;
  requiere sesión y solo permite consultar los amigos de la propia cuenta.

Seguirse a uno mismo responde `400`, repetir un seguimiento responde `409` y
dejar de seguir una relación inexistente responde `404`. Los cambios requieren
autenticación y CSRF cuando se usa la cookie de sesión. Dejar de seguir rompe la
amistad, pero conserva el seguimiento que todavía exista en la otra dirección.

La migración `002_reemplazar_amistades_por_seguimientos.sql` convierte cada
amistad aceptada existente en dos seguimientos y descarta solicitudes pendientes
o rechazadas.

### Perfil público con reseñas

`GET /usuarios/{usuario_id}/perfil-publico` devuelve el nombre, apellido,
nombre de usuario, foto, biografía, ubicación, géneros favoritos, rol, fecha
de registro, reputación, cantidad de seguidores, cantidad de seguidos y
reseñas de cualquier usuario existente.
También se puede consultar por nombre de usuario con
`GET /usuarios/por-nombre/{nombre_usuario}/perfil-publico` (por ejemplo,
`/usuarios/por-nombre/ana/perfil-publico`). La búsqueda ignora mayúsculas y
minúsculas y exige el nombre completo; si no existe, responde `404`.
No requiere token. Las reseñas se ordenan por `fecha` descendente; ante fechas
iguales, por `id` descendente. Cada reseña incluye `id`, `contenido_tmdb_id`,
`contenido_tipo`, `contenido_titulo`, `plataforma_id`, `calificacion`, `texto`
y `fecha`. La reputación es la suma de
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

La respuesta identifica cada contenido con su tipo e ID de TMDB. El frontend
usa esos datos para consultar la ficha actual y mostrar título, año y póster;
`contenido_titulo` queda como respaldo si TMDB no está disponible.

## Ficha de película o serie

La ficha consume dos endpoints públicos e independientes:

- `GET /contenidos/generos` combina las listas oficiales de géneros de
  películas y series de TMDB. La respuesta se conserva en memoria durante la
  vida del proceso para evitar consultas repetidas.
- `GET /contenidos/{tipo}/{tmdb_id}` obtiene el detalle desde TMDB. `tipo`
  admite `pelicula` o `serie`.
- `GET /contenidos/{tipo}/{tmdb_id}/resenas` obtiene las reseñas locales,
  incluyendo su autor y la suma de valoraciones. La lista se ordena por
  `fecha` descendente y, para fechas iguales, por `id` descendente. Si no hay
  reseñas devuelve `[]`.

La consulta a TMDB necesita `TMDB_ACCESS_TOKEN`. Un ID inexistente devuelve
`404`; si TMDB no está configurado o no responde, la ficha devuelve `502`. El
endpoint de reseñas sigue disponible aunque TMDB tenga una incidencia.

Ejemplos:

```http
GET http://localhost:8000/contenidos/pelicula/550
GET http://localhost:8000/contenidos/generos
GET http://localhost:8000/contenidos/pelicula/550/resenas
GET http://localhost:8000/contenidos/serie/1399
GET http://localhost:8000/contenidos/serie/1399/resenas
```

### Publicar una reseña

`POST /contenidos/{tipo}/{tmdb_id}/resenas` publica una reseña o una respuesta.
Requiere una sesión válida y, si la autenticación proviene de una cookie, el
encabezado `X-CSRF-Token`. El `usuario_id` del cuerpo debe coincidir con el de
la sesión; la API nunca permite publicar en nombre de otra cuenta.

```json
{
  "usuario_id": "d25f6b52-b42a-4a22-98a5-92559be9815b",
  "texto": "Una película inolvidable",
  "calificacion": 4.5,
  "plataforma_id": 2,
  "resena_padre_id": null
}
```

Antes de guardar, la API comprueba que la película o serie exista en TMDB. Si
`resena_padre_id` tiene valor, también comprueba que esa reseña exista y
pertenezca al mismo contenido. La respuesta exitosa usa estado `201`.

Para habilitar respuestas en una base ya creada, se debe aplicar
`migrations/001_agregar_resena_padre.sql`.

Los endpoints de perfil trabajan con el UUID que devuelve el registro o
`GET /auth/me`:

- `GET /usuarios/{usuario_id}/perfil`: obtiene los datos públicos del usuario.
- `PATCH /usuarios/{usuario_id}/perfil`: requiere el token Bearer del login y
  modifica solamente los campos enviados del usuario autenticado. El UUID de
  la ruta debe coincidir con el usuario del token.

El `PATCH` acepta `nombre`, `apellido`, `nombre_usuario`, `email`, `foto_url`,
`bio`, `ubicacion` y `generos_favoritos` (hasta cinco valores distintos que
deben pertenecer a la lista oficial devuelta por `GET /contenidos/generos`).
El email y el nombre de usuario siguen siendo únicos. `foto_url` debe ser una
URL HTTP/HTTPS pública, normalmente la obtenida después de subir la imagen a
Supabase Storage. Para quitar la foto, biografía o ubicación se envía el campo
correspondiente con `null`.

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
  "foto_url": "https://ejemplo.com/fotos/perfil.jpg",
  "bio": "Fan del cine independiente",
  "ubicacion": "Montevideo, Uruguay",
  "generos_favoritos": ["Drama", "Comedia"]
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

`PATCH /usuarios/{usuario_id}/password` cambia la contraseña de la propia
cuenta. Requiere `password_actual`, `password_nueva`, sesión y protección CSRF.
La contraseña nueva debe tener entre 8 y 128 caracteres y ser distinta de la
actual. Una contraseña actual incorrecta responde `400`; intentar modificar
otra cuenta responde `403`.

Las columnas de perfil se agregan a instalaciones existentes mediante
`migrations/003_agregar_datos_perfil.sql`.

## Administración de cuentas

Las acciones de moderación requieren una sesión con rol `admin`. Si la sesión
usa una cookie, también requieren el encabezado `X-CSRF-Token`; con Bearer no
es necesario el token CSRF.

- `PATCH /usuarios/{usuario_id}/suspender` cambia la cuenta a `suspendido`.
- `DELETE /usuarios/{usuario_id}` realiza una eliminación lógica y cambia la
  cuenta a `eliminado`, conservando sus datos relacionados.

Ambos endpoints devuelven el usuario actualizado con estado `200`. Una cuenta
suspendida o eliminada no puede iniciar sesión ni seguir usando un token ya
emitido. Suspender una cuenta eliminada devuelve `409 Conflict`; un UUID que no
existe devuelve `404 Not Found`. Una cuenta autenticada sin rol de
administrador recibe `403 Forbidden`.

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

En **Render → cinesfera → Environment**, estas variables hay que agregarlas a mano:

| Variable | Valor |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `API_URL` | `https://cinesfera.onrender.com` |
| `CORS_ORIGINS` | `https://cinesfera-three.vercel.app` |
| `TMDB_ACCESS_TOKEN` | Token de lectura de la cuenta de TMDB |

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


## SCRUM-123: valoraciones por usuario y reseña

Aplicar en orden las migraciones `001_agregar_resena_padre.sql` y
`004_calificaciones_comunidad.sql` antes de usar este backend. La migración comunitaria
permite `calificacion = null` y crea `calificaciones_resenas` con una clave
primaria `(usuario_id, resena_id)` que impide duplicados incluso concurrentes.
No se requieren migraciones adicionales para SCRUM-123.

En `POST /contenidos/{tipo}/{tmdb_id}/resenas`:

- Sin `resena_padre_id`: la reseña original requiere calificación.
- Con el ID de una reseña original: admite comentario y una valoración
  de 0.5 a 5 en pasos de 0.5. La valoración y el comentario se guardan
  en una sola transacción. Un duplicado devuelve `409` sin guardar el comentario.
- Para comentar sin valorar, omitir `calificacion` o enviar `null`.
- Las respuestas a comentarios y las autovaloraciones con estrellas
  se rechazan con `422`. Se pueden responder comentarios sin estrellas.

Las respuestas de creación, listado y perfil admiten `calificacion: null`.
La tabla `valoraciones_resena` conserva su función previa y es independiente
de las calificaciones con estrellas de `calificaciones_resenas`.

## Conexión con TMDB

El catálogo, las búsquedas y las fichas comparten un cliente HTTP persistente.
Por defecto las conexiones salientes usan IPv4 (`TMDB_FORCE_IPV4=true`),
independientemente del host con el que se inicia Uvicorn. Para habilitar la
resolución automática de ambas familias, configurar `TMDB_FORCE_IPV4=false` y
reiniciar el backend.

Solo se reintentan lecturas: hasta tres intentos ante cortes de transporte,
timeouts y respuestas 429/500/502/503/504. Las lecturas exitosas se conservan
60 segundos (hasta 128 combinaciones de ruta y filtros); ante un fallo
transitorio se puede usar esa misma lectura por un máximo de cinco minutos.
Los errores de autenticación y los contenidos inexistentes no usan ese respaldo.

Publicar reseñas o valoraciones de contenidos que ya están en la base local no
consulta TMDB. Las operaciones de escritura nunca se reintentan automáticamente.

## SCRUM-127: editar una valoración existente

- `GET /contenidos/{tipo}/{tmdb_id}/valoraciones/mias` devuelve las puntuaciones
  vigentes del usuario autenticado, con `resena_id` y `calificacion`.
- `PATCH /contenidos/{tipo}/{tmdb_id}/resenas/{resena_id}/valoracion` recibe
  únicamente `{"calificacion": 4.5}`. Admite valores de 0.5 a 5 en pasos de 0.5.
  La identidad se obtiene de la sesión; no admite `usuario_id` ni texto.
- La actualización modifica la fila existente de `calificaciones_resenas` y
  devuelve la puntuación, el promedio comunitario y la cantidad de valoraciones.
  El comentario, su fecha y la puntuación original de la película se conservan.
- Sin sesión responde `401`; sin valoración propia, `403`; si la reseña padre
  no pertenece al contenido indicado, `404`; ante datos inválidos, `422`.
  Las sesiones por cookie requieren el encabezado `X-CSRF-Token`.

El frontend precarga las estrellas, permite cancelar o reintentar y actualiza
el promedio con la respuesta confirmada del backend. No requiere otra migración
además de la tabla comunitaria de SCRUM-123.
