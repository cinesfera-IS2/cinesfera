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

`POST /auth/login` valida las credenciales y devuelve los datos públicos del
usuario. En esta etapa no emite tokens ni crea una sesión persistente.

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

Esperado: `200 OK` con `id`, `nombre`, `apellido`, `nombre_usuario`, `email`,
`foto_url`, `rol`, `estado` y `fecha_registro`. No incluye contraseña ni hash.

#### 3. Inicio correcto por nombre de usuario

```http
POST http://localhost:8000/auth/login
Content-Type: application/json

{
  "identificador": "persona.prueba",
  "password": "ClaveSegura123"
}
```

Esperado: `200 OK` con la misma cuenta del caso anterior.
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

Las pruebas usan `unittest`, consultas simuladas y hashes reales. Cubren la
función del endpoint junto con el servicio, credenciales válidas e inválidas,
normalización del identificador y exclusión de contraseña y hash en la respuesta.
No realizan solicitudes HTTP ni verifican la conexión a una base de datos real.

## Estructura del proyecto

```
backend/
├── app/
│   └── main.py        # Punto de entrada de la aplicación FastAPI
├── requirements.txt    # Dependencias del proyecto
└── .venv/              # Entorno virtual local (no se versiona)
```

## Agregar una nueva dependencia

1. Con el entorno virtual activado, instalá el paquete:

   ```bash
   pip install <paquete>
   ```

2. Agregalo a `requirements.txt` (a mano, o regenerando el archivo con `pip freeze > requirements.txt`) y avisá al equipo para que actualicen su entorno con `pip install -r requirements.txt`.
