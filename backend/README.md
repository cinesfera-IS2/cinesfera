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
