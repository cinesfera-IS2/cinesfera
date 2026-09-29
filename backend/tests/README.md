# Tests del backend

## Cómo se corren

Desde `backend`, con el entorno virtual activado:

```bash
python -m unittest discover -s tests -v          # todos
python -m unittest tests.test_registro -v        # un archivo
python -m unittest tests.test_registro.RegistroTests.test_datos_invalidos_responden_422_y_no_crean_nada
```

Cada test aparece con `ok` si pasó, o con `FAIL` y la diferencia entre lo que se
esperaba y lo que salió si falló. Al final se ve el total (`Ran 23 tests ... OK`).

No hace falta tener el servidor levantado ni un `.env` con la base configurada.

## Qué es un test

Una función que usa el código con datos elegidos a mano y comprueba que el
resultado sea el esperado. Casi todos siguen tres pasos:

1. **Preparar**: armar la situación ("existe un usuario con este email").
2. **Ejecutar**: llamar a lo que se quiere probar (`POST /auth/register`).
3. **Verificar**: comparar el resultado con lo esperado (`409` y el mensaje).

Los `assert...` son las comprobaciones: `assertEqual(a, b)` falla si `a` y `b`
son distintos, `assertIsNone(x)` falla si `x` tiene un valor, etc.

## ¿De dónde salen los usuarios?

Se inventan en cada test. `crear_base_en_memoria` (en `utilidades.py`) crea una
base SQLite vacía que existe solo mientras corre el test, y `crear_usuario` le
agrega usuarios con datos de ejemplo (`persona@example.com`). Cuando el test
termina, la base desaparece. Por eso:

- no se toca Supabase ni ningún dato real;
- cada test arranca de cero y no depende del orden en que corran;
- se puede probar cualquier situación (un email ya usado, un usuario borrado...)
  simplemente creándola.

## Dos estilos que conviven

| Archivo | Cómo prueba | Cuándo conviene |
| --- | --- | --- |
| `test_registro.py`, `test_perfil_autenticado.py`, `test_perfil_publico.py` | Pedidos HTTP reales a la API (`TestClient`) contra la base en memoria | Probar un endpoint de punta a punta: validación, servicio, base y respuesta |
| `test_auth.py`, `test_perfil.py` | Llaman directo a la función y reemplazan la base por un `Mock` | Probar una regla puntual sin armar datos |

Un `Mock` es un objeto falso al que se le dice qué responder
(`db.scalar.return_value = None` significa "la consulta no encontró nada") y
que después permite preguntar cómo se lo usó (`db.commit.assert_not_called()`).

## Agregar un test nuevo

1. Creá `tests/test_<tema>.py` (tiene que empezar con `test_` para que lo encuentre).
2. Partí de esta plantilla:

```python
import unittest

from app.models.usuario import Usuario
from tests.utilidades import conectar_api, crear_base_en_memoria, crear_usuario


class MiFuncionalidadTests(unittest.TestCase):
    def setUp(self):
        # Corre antes de CADA test: base nueva y cliente de la API.
        self.db = crear_base_en_memoria(self, Usuario)
        self.usuario = crear_usuario(self.db, "persona")
        self.client = conectar_api(self, self.db)

    def test_describe_lo_que_deberia_pasar(self):
        respuesta = self.client.get(f"/usuarios/{self.usuario.id}/perfil")

        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        self.assertEqual(respuesta.json()["nombre_usuario"], "persona")
```

3. Si el endpoint pide estar logueado, llamá a `configurar_jwt(self)` en el
   `setUp`, creá el usuario con `password_hash=generar_hash_password(...)` y
   hacé login para conseguir el token (ver `iniciar_sesion` en
   `test_perfil_autenticado.py`).

## Qué casos probar

Para cada funcionalidad, pensá al menos en:

- el camino feliz (datos correctos → funciona y se guarda);
- datos inválidos (→ `422` y no se guarda nada);
- conflictos (email o nombre de usuario repetido → `409`);
- permisos (sin token, token vencido, tocar lo de otro → `401` / `403`);
- que la respuesta no exponga datos sensibles (`password_hash`).

Un test también tiene que poder fallar: si cambiás una regla a propósito (por
ejemplo, el largo mínimo de la contraseña) y ningún test se pone en rojo, falta
un test.
