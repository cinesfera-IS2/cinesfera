// Levanta el backend que usan los tests e2e, aislado de Supabase: un Postgres
// propio (lo instala `pnpm install`) con las tablas vacías y el FastAPI del
// repo conectado a él. Lo arranca Playwright desde playwright.config.ts.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import EmbeddedPostgres from "embedded-postgres";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const BACKEND = path.resolve(AQUI, "../../../backend");
const EN_WINDOWS = process.platform === "win32";

const PUERTO_POSTGRES = Number(process.env.E2E_PUERTO_POSTGRES ?? 54329);
const PUERTO_BACKEND = Number(process.env.E2E_PUERTO_BACKEND ?? 8100);
const PUERTO_FRONTEND = Number(process.env.E2E_PUERTO_FRONTEND ?? 3100);
const DIRECTORIO_BASE = path.join(tmpdir(), "cinesfera-e2e-postgres");

function ejecutar(comando, args, opciones = {}) {
  const resultado = spawnSync(comando, args, { stdio: "inherit", ...opciones });
  return resultado.status === 0;
}

function pythonDelEntorno(directorio) {
  const ejecutable = EN_WINDOWS
    ? path.join(directorio, "Scripts", "python.exe")
    : path.join(directorio, "bin", "python");
  return existsSync(ejecutable) ? ejecutable : undefined;
}

function crearEntornoVirtual() {
  const destino = path.join(BACKEND, ".venv");
  const candidatos = EN_WINDOWS
    ? [["py", ["-3"]], ["python", []]]
    : [["python3", []], ["python", []]];

  for (const [comando, previos] of candidatos) {
    if (ejecutar(comando, [...previos, "-m", "venv", destino])) {
      return pythonDelEntorno(destino);
    }
  }
  throw new Error(
    "No se encontró Python 3 para crear backend/.venv. Instalalo o indicá uno con E2E_PYTHON."
  );
}

/** Devuelve un Python con las dependencias del backend; si falta, lo prepara. */
function prepararPython() {
  const python =
    process.env.E2E_PYTHON ??
    pythonDelEntorno(path.join(BACKEND, ".venv")) ??
    pythonDelEntorno(path.join(BACKEND, "venv")) ??
    crearEntornoVirtual();

  const tieneDependencias = ejecutar(
    python,
    ["-c", "import fastapi, uvicorn, psycopg, pydantic_settings, email_validator"],
    { stdio: "ignore" }
  );
  if (!tieneDependencias) {
    console.log("Instalando las dependencias del backend en", python);
    const instalo = ejecutar(python, ["-m", "pip", "install", "-r", "requirements.txt"], {
      cwd: BACKEND,
    });
    if (!instalo) throw new Error("Falló pip install -r backend/requirements.txt");
  }
  return python;
}

async function main() {
  const python = prepararPython();

  // Cada corrida arranca con la base vacía, aunque la anterior se haya cortado.
  rmSync(DIRECTORIO_BASE, { recursive: true, force: true });
  const postgres = new EmbeddedPostgres({
    databaseDir: DIRECTORIO_BASE,
    port: PUERTO_POSTGRES,
    user: "postgres",
    password: "postgres",
    persistent: false,
    // Sin esto la base queda en SQL_ASCII y psycopg devuelve bytes en vez de texto.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
  });
  await postgres.initialise();
  await postgres.start();

  // Las variables del proceso pisan a backend/.env, así que la base nunca es
  // la de Supabase. TMDB_ACCESS_TOKEN sí se toma del .env de cada uno.
  const entorno = {
    ...process.env,
    PYTHONPATH: BACKEND,
    ENVIRONMENT: "local",
    // Con esta URL arma el backend el enlace de las fotos de perfil.
    API_URL: `http://localhost:${PUERTO_BACKEND}`,
    DATABASE_URL: `postgresql://postgres:postgres@localhost:${PUERTO_POSTGRES}/postgres`,
    DB_SSLMODE: "disable",
    CORS_ORIGINS: `http://localhost:${PUERTO_FRONTEND}`,
    COOKIE_SECURE: "false",
    JWT_SECRET_KEY: "clave-de-los-tests-e2e-de-al-menos-32-caracteres",
    ADMIN_INICIAL_EMAIL: "admin.e2e@example.com",
    ADMIN_INICIAL_PASSWORD: "Admin-E2E-Cinesfera-123",
    ADMIN_INICIAL_USUARIO: "admin_e2e",
  };

  if (!ejecutar(python, [path.join(AQUI, "crear_esquema.py")], { cwd: BACKEND, env: entorno })) {
    await postgres.stop();
    throw new Error("No se pudieron crear las tablas en la base de los tests e2e");
  }

  const servidor = spawn(
    python,
    ["-m", "uvicorn", "app.main:app", "--port", String(PUERTO_BACKEND)],
    { cwd: BACKEND, env: entorno, stdio: "inherit" }
  );

  let cerrando = false;
  async function cerrar(codigo = 0) {
    if (cerrando) return;
    cerrando = true;
    servidor.kill();
    await postgres.stop().catch(() => {});
    rmSync(DIRECTORIO_BASE, { recursive: true, force: true });
    process.exit(codigo);
  }

  process.on("SIGINT", () => cerrar());
  process.on("SIGTERM", () => cerrar());
  servidor.on("exit", (codigo) => cerrar(codigo ?? 1));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
